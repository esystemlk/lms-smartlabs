import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, startTime, duration, agenda, type } = body;

    const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
    // Use API-specific credentials (Server-to-Server OAuth)
    const ZOOM_CLIENT_ID = process.env.ZOOM_API_CLIENT_ID || process.env.ZOOM_CLIENT_ID;
    const ZOOM_CLIENT_SECRET = process.env.ZOOM_API_CLIENT_SECRET || process.env.ZOOM_CLIENT_SECRET;

    if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      const missing = [];
      if (!ZOOM_ACCOUNT_ID) missing.push("ZOOM_ACCOUNT_ID");
      if (!ZOOM_CLIENT_ID) missing.push("ZOOM_API_CLIENT_ID");
      if (!ZOOM_CLIENT_SECRET) missing.push("ZOOM_API_CLIENT_SECRET");
      
      const errorMsg = `Zoom API credentials missing: ${missing.join(", ")}. Please check your .env.local file.`;
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
