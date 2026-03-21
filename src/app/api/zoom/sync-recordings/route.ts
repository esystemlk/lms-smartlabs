import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  collectionGroup, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc
} from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    // 1. Get Zoom Config from Firestore
    const { getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(db, 'settings', 'global'));
    const zoomCfg = snap.exists() ? (snap.data() as any)?.zoom?.serverToServer : null;
    
    const ZOOM_ACCOUNT_ID = zoomCfg?.accountId;
    const ZOOM_CLIENT_ID = zoomCfg?.clientId;
    const ZOOM_CLIENT_SECRET = zoomCfg?.clientSecret;

    if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      return NextResponse.json({ error: 'Zoom credentials not configured' }, { status: 500 });
    }

    // 2. Get Zoom Access Token
    const params = new URLSearchParams();
    params.set('grant_type', 'account_credentials');
    params.set('account_id', String(ZOOM_ACCOUNT_ID));
    
    const tokenRes = await fetch(`https://zoom.us/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('Failed to get token');

    // 3. Fetch recordings from Zoom (last 7 days)
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const fromStr = from.toISOString().split('T')[0];
    
    const recordingsRes = await fetch(`https://api.zoom.us/v2/users/me/recordings?from=${fromStr}`, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const recordingsData = await recordingsRes.json();
    
    if (!recordingsData.meetings) {
        return NextResponse.json({ processedMeetings: 0, message: "No meetings found in Zoom" });
    }

    let processedCount = 0;

    // 4. Update lessons in Firestore
    for (const meeting of recordingsData.meetings) {
        const meetingId = String(meeting.id);
        const playUrl = meeting.share_url;
        
        // Find ALL lessons with this meeting ID using collectionGroup
        const lessonsQuery = query(
            collectionGroup(db, 'lessons'),
            where('zoomMeetingId', '==', meetingId)
        );
        
        const lessonsSnap = await getDocs(lessonsQuery);
        
        if (!lessonsSnap.empty) {
            const updatePromises = lessonsSnap.docs.map(lessonDoc => 
                updateDoc(lessonDoc.ref, {
                    recordingUrl: playUrl,
                    recordingStatus: 'processed',
                    updatedAt: new Date()
                })
            );
            await Promise.all(updatePromises);
            processedCount++;
        }
    }

    return NextResponse.json({ 
        processedMeetings: processedCount, 
        totalZoomMeetings: recordingsData.meetings.length 
    });

  } catch (error: any) {
    console.error("Zoom Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
