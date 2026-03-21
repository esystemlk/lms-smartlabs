import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collectionGroup, query, where, getDocs, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const rl = rateLimit(req, 'api/cron/process-recordings', 5, 60_000);
    if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const secret = process.env.CRON_SECRET;
    const head = req.headers.get("x-cron-secret");
    if (!secret || head !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const settingsRef = doc(db, "settings", "general");
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) return NextResponse.json({ message: "No settings found" }, { status: 500 });

    const { bunnyLibraryId, bunnyApiKey } = settingsSnap.data();
    if (!bunnyLibraryId || !bunnyApiKey) return NextResponse.json({ message: "Bunny.net credentials missing" }, { status: 500 });

    const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
    const ZOOM_CLIENT_ID = process.env.ZOOM_API_CLIENT_ID || process.env.ZOOM_CLIENT_ID;
    const ZOOM_CLIENT_SECRET = process.env.ZOOM_API_CLIENT_SECRET || process.env.ZOOM_CLIENT_SECRET;

    if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) return NextResponse.json({ message: "Zoom credentials missing" }, { status: 500 });

    const tokenResponse = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}` }
    });
    const { access_token: zoomAccessToken } = await tokenResponse.json();
    if (!zoomAccessToken) return NextResponse.json({ message: "Failed to get Zoom token" }, { status: 500 });

    // 3. Find Pending Lessons
    // We look for lessons of type live_class that don't have a recordingId yet.
    // We filter by date in memory to get lessons from the last 7 days.
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - 7);

    const q = query(collectionGroup(db, "lessons"), where("type", "==", "live_class"));
    const snapshot = await getDocs(q);
    
    // Group lessons by zoomMeetingId
    const lessonsByMeeting: Record<string, any[]> = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const startTime = data.startTime ? new Date(data.startTime) : null;
      if (startTime && startTime > lookbackDate && startTime < new Date() && (!data.recordingStatus || data.recordingStatus === 'pending') && data.zoomMeetingId) {
        if (!lessonsByMeeting[data.zoomMeetingId]) lessonsByMeeting[data.zoomMeetingId] = [];
        lessonsByMeeting[data.zoomMeetingId].push({ id: doc.id, ref: doc.ref, data });
      }
    });

    const meetingIds = Object.keys(lessonsByMeeting);
    const results = [];

    for (const meetingId of meetingIds) {
      const lessons = lessonsByMeeting[meetingId];
      const primaryLesson = lessons[0].data;

      try {
        // A. Check Zoom
        const zoomRecRes = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
          headers: { 'Authorization': `Bearer ${zoomAccessToken}` }
        });

        if (!zoomRecRes.ok) {
          results.push({ meetingId, status: 'zoom_failed', error: await zoomRecRes.text() });
          continue;
        }

        const recData = await zoomRecRes.json();
        const videoFile = (recData.recording_files || [])
          .filter((f: any) => f.file_type === 'MP4')
          .sort((a: any, b: any) => (b.file_size || 0) - (a.file_size || 0))[0];

        if (!videoFile) {
          results.push({ meetingId, status: 'no_recording' });
          continue;
        }

        // B. Create & Fetch in Bunny.net
        const createRes = await fetch(`https://video.bunnycdn.com/library/${bunnyLibraryId}/videos`, {
          method: "POST",
          headers: { "AccessKey": bunnyApiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ title: primaryLesson.title || `Class ${meetingId}` }),
        });
        const { guid: videoId } = await createRes.json();

        const downloadUrl = `${videoFile.download_url}?access_token=${zoomAccessToken}`;
        await fetch(`https://video.bunnycdn.com/library/${bunnyLibraryId}/videos/${videoId}/fetch`, {
          method: "POST",
          headers: { "AccessKey": bunnyApiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ url: downloadUrl }),
        });

        // C. Update ALL binded lessons
        const batch = writeBatch(db);
        lessons.forEach(l => {
          batch.update(l.ref, {
            recordingStatus: 'processing',
            bunnyVideoId: videoId,
            recordingUrl: videoId,
            zoomRecordingId: videoFile.id,
            updatedAt: new Date().toISOString()
          });
        });
        await batch.commit();

        results.push({ meetingId, status: 'initiated', lessonsCount: lessons.length, videoId });

      } catch (err: any) {
        results.push({ meetingId, status: 'error', message: err.message });
      }
    }

    return NextResponse.json({ message: "Sync complete", processedMeetings: meetingIds.length, details: results });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
