import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collectionGroup, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(req: Request) {
  try {
    // 1. Get Settings (Bunny.net credentials)
    const settingsRef = doc(db, "settings", "general");
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      return NextResponse.json({ message: "No settings found" }, { status: 500 });
    }

    const settings = settingsSnap.data();
    const { bunnyLibraryId, bunnyApiKey } = settings;

    if (!bunnyLibraryId || !bunnyApiKey) {
      return NextResponse.json({ message: "Bunny.net credentials missing" }, { status: 500 });
    }

    // 2. Get Zoom Access Token (Server-to-Server OAuth)
    const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
    const ZOOM_CLIENT_ID = process.env.ZOOM_API_CLIENT_ID || process.env.ZOOM_CLIENT_ID;
    const ZOOM_CLIENT_SECRET = process.env.ZOOM_API_CLIENT_SECRET || process.env.ZOOM_CLIENT_SECRET;

    if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      return NextResponse.json({ message: "Zoom credentials missing" }, { status: 500 });
    }

    const tokenResponse = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`
      }
    });

    const tokenData = await tokenResponse.json();
    const zoomAccessToken = tokenData.access_token;

    if (!zoomAccessToken) {
      return NextResponse.json({ message: "Failed to get Zoom token" }, { status: 500 });
    }

    // 3. Find Pending Lessons (Past 24 hours, live_class, no recording)
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setHours(yesterday.getHours() - 24);

    const q = query(
      collectionGroup(db, "lessons"),
      where("type", "==", "live_class")
      // Note: Firestore limitation prevents complex inequality filters on different fields.
      // We will fetch recent classes and filter in memory.
    );

    const snapshot = await getDocs(q);
    const pendingLessons = snapshot.docs.filter(doc => {
      const data = doc.data();
      const startTime = data.startTime ? new Date(data.startTime) : null;
      
      // Filter: Started in last 24 hours AND ended (assuming 2 hours max duration for safety, or just started < now)
      // And recordingStatus is NOT 'processed' or 'processing' (or explicitly 'pending' or missing)
      const isRecent = startTime && startTime > yesterday && startTime < now;
      const needsRecording = !data.recordingStatus || data.recordingStatus === 'pending';
      const hasZoomId = !!data.zoomMeetingId;

      return isRecent && needsRecording && hasZoomId;
    });

    const results = [];

    // 4. Process Each Lesson
    for (const lessonDoc of pendingLessons) {
      const lessonData = lessonDoc.data();
      const meetingId = lessonData.zoomMeetingId;

      try {
        // A. Check Zoom for Recordings
        const zoomRecResponse = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
          headers: { 'Authorization': `Bearer ${zoomAccessToken}` }
        });

        if (!zoomRecResponse.ok) {
          results.push({ id: lessonDoc.id, status: 'zoom_check_failed', error: await zoomRecResponse.text() });
          continue;
        }

        const recData = await zoomRecResponse.json();
        const recordingFiles = recData.recording_files || [];

        // Find best MP4 file (largest or specific type)
        const videoFile = recordingFiles
          .filter((f: any) => f.file_type === 'MP4')
          .sort((a: any, b: any) => (b.file_size || 0) - (a.file_size || 0))[0];

        if (!videoFile) {
          results.push({ id: lessonDoc.id, status: 'no_recording_found' });
          continue;
        }

        // B. Create Video in Bunny.net
        const createVideoRes = await fetch(`https://video.bunnycdn.com/library/${bunnyLibraryId}/videos`, {
          method: "POST",
          headers: {
            "AccessKey": bunnyApiKey,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ title: lessonData.title || `Class ${meetingId}` }),
        });

        if (!createVideoRes.ok) {
          results.push({ id: lessonDoc.id, status: 'bunny_create_failed' });
          continue;
        }

        const videoObj = await createVideoRes.json();
        const videoId = videoObj.guid;

        // C. Trigger Fetch in Bunny.net
        // Append access_token to download_url
        const downloadUrl = `${videoFile.download_url}?access_token=${zoomAccessToken}`;
        
        const fetchRes = await fetch(`https://video.bunnycdn.com/library/${bunnyLibraryId}/videos/${videoId}/fetch`, {
          method: "POST",
          headers: {
            "AccessKey": bunnyApiKey,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ url: downloadUrl }),
        });

        if (!fetchRes.ok) {
           // Rollback? Or just log error.
           results.push({ id: lessonDoc.id, status: 'bunny_fetch_failed', error: await fetchRes.text() });
           continue;
        }

        // D. Update Firestore
        await updateDoc(lessonDoc.ref, {
          recordingStatus: 'processing',
          bunnyVideoId: videoId,
          recordingUrl: videoId, // Use ID as URL/Ref
          zoomRecordingId: videoFile.id
        });

        results.push({ id: lessonDoc.id, status: 'initiated', videoId });

      } catch (err: any) {
        console.error(`Error processing lesson ${lessonDoc.id}:`, err);
        results.push({ id: lessonDoc.id, status: 'error', message: err.message });
      }
    }

    return NextResponse.json({
      message: "Sync complete",
      processed: results.length,
      details: results
    });

  } catch (error: any) {
    console.error("Process recordings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
