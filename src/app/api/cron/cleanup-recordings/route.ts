import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, collectionGroup, query, where, getDocs, updateDoc } from "firebase/firestore";

// This route should be protected, e.g., by a CRON_SECRET header in production
// Vercel Cron will send this header
export async function GET(request: Request) {
  try {
    // 1. Get Settings
    const settingsRef = doc(db, "settings", "general");
    const settingsSnap = await getDoc(settingsRef);
    
    if (!settingsSnap.exists()) {
      return NextResponse.json({ message: "No settings found" }, { status: 200 });
    }

    const settings = settingsSnap.data();
    const expirationDays = settings.recordingExpirationDays;
    const bunnyLibraryId = settings.bunnyLibraryId;
    const bunnyApiKey = settings.bunnyApiKey;

    if (!expirationDays || expirationDays <= 0) {
      return NextResponse.json({ message: "Auto-deletion disabled" }, { status: 200 });
    }

    if (!bunnyLibraryId || !bunnyApiKey) {
      return NextResponse.json({ message: "Bunny.net credentials missing" }, { status: 500 });
    }

    // 2. Calculate Cutoff Date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - expirationDays);

    console.log(`Running cleanup for recordings older than ${cutoffDate.toISOString()}`);

    // 3. Find Expired Recordings
    // Query all live_class lessons with a recordingUrl
    const q = query(
      collectionGroup(db, "lessons"),
      where("type", "==", "live_class"),
      where("recordingStatus", "==", "processed") // Optional: assume processed
    );

    const snapshot = await getDocs(q);
    const expiredLessons = snapshot.docs.filter(doc => {
      const data = doc.data();
      const recordingDate = data.startTime ? new Date(data.startTime) : null;
      // Only process if it has a Bunny Video ID (to avoid deleting external links)
      const hasBunnyVideo = !!data.bunnyVideoId; 
      
      return recordingDate && recordingDate < cutoffDate && hasBunnyVideo;
    });

    console.log(`Found ${expiredLessons.length} expired recordings`);

    // 4. Delete from Bunny.net and Update Firestore
    const results = await Promise.allSettled(expiredLessons.map(async (lessonDoc) => {
      const data = lessonDoc.data();
      const videoId = data.bunnyVideoId;

      // Delete from Bunny
      const response = await fetch(`https://video.bunnycdn.com/library/${bunnyLibraryId}/videos/${videoId}`, {
        method: "DELETE",
        headers: {
          "AccessKey": bunnyApiKey,
          "Accept": "application/json"
        }
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete video ${videoId} from Bunny`);
      }

      // Update Firestore to remove recording link
      await updateDoc(lessonDoc.ref, {
        recordingUrl: null,
        bunnyVideoId: null,
        recordingStatus: "expired",
        recordingDeletedAt: new Date().toISOString()
      });

      return videoId;
    }));

    const successful = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    return NextResponse.json({
      message: "Cleanup complete",
      found: expiredLessons.length,
      deleted: successful,
      failed: failed
    });

  } catch (error: any) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}