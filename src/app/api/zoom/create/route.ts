import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const rl = rateLimit(req, 'api/zoom/create', 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const schema = z.object({
      topic: z.string().min(1).max(200).optional(),
      startTime: z.string().datetime().optional(),
      duration: z.number().int().positive().optional(),
      agenda: z.string().max(1000).optional(),
      type: z.number().int().optional()
    });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const { topic, startTime, duration, agenda, type } = parsed.data;

    // Prefer Firestore settings over env
    let ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
    let ZOOM_CLIENT_ID = process.env.ZOOM_API_CLIENT_ID || process.env.ZOOM_CLIENT_ID;
    let ZOOM_CLIENT_SECRET = process.env.ZOOM_API_CLIENT_SECRET || process.env.ZOOM_CLIENT_SECRET;

    try {
      const { db } = await import('@/lib/firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(db, 'settings', 'global'));
      if (snap.exists()) {
        const z = (snap.data() as any)?.zoom?.serverToServer;
        if (z?.accountId && z?.clientId && z?.clientSecret) {
          ZOOM_ACCOUNT_ID = z.accountId;
          ZOOM_CLIENT_ID = z.clientId;
          ZOOM_CLIENT_SECRET = z.clientSecret;
        }
      }
    } catch {}

    if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      const missing = [];
      if (!ZOOM_ACCOUNT_ID) missing.push("ZOOM_ACCOUNT_ID");
      if (!ZOOM_CLIENT_ID) missing.push("ZOOM_API_CLIENT_ID");
      if (!ZOOM_CLIENT_SECRET) missing.push("ZOOM_API_CLIENT_SECRET");
      
      const errorMsg = `Zoom API credentials missing: ${missing.join(", ")}. Configure them in Developer Settings.`;
      console.error(errorMsg);
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    // 1. Get Access Token (Server-to-Server OAuth)
    const tokenResponse = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`
      }
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to get Zoom access token: ' + JSON.stringify(tokenData));
    }

    // 2. Create Meeting
    const meetingResponse = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: topic || "Live Class",
        type: type || 2, // 1 = Instant, 2 = Scheduled
        start_time: startTime, // ISO format: 2024-02-28T10:00:00Z
        duration: duration || 60, // minutes
        agenda: agenda,
        settings: {
          host_video: true,
          participant_video: false,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          auto_recording: "cloud"
        }
      })
    });

    const meetingData = await meetingResponse.json();

    if (meetingData.error) {
      throw new Error('Failed to create Zoom meeting: ' + JSON.stringify(meetingData));
    }

    return NextResponse.json(meetingData);

  } catch (error: any) {
    console.error("Zoom Create Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
