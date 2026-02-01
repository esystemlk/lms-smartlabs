import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, config } = body;

    if (type === 'zoom') {
      // Test Zoom Connection (Environment Variables)
      const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
      const ZOOM_CLIENT_ID = process.env.ZOOM_API_CLIENT_ID || process.env.ZOOM_CLIENT_ID;
      const ZOOM_CLIENT_SECRET = process.env.ZOOM_API_CLIENT_SECRET || process.env.ZOOM_CLIENT_SECRET;

      if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
        return NextResponse.json({ 
          success: false, 
          message: "Missing Zoom credentials in environment variables (.env.local)." 
        });
      }

      // Attempt to get Access Token
      const tokenResponse = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`
        }
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        return NextResponse.json({ 
          success: false, 
          message: `Zoom connection failed: ${tokenResponse.status} ${tokenResponse.statusText}`,
          details: errorText
        });
      }

      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        return NextResponse.json({ 
          success: false, 
          message: "Zoom connection failed: No access token received." 
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: "Zoom connection successful! Access token retrieved." 
      });
    } 
    
    else if (type === 'bunny') {
      // Test Bunny.net Connection (Provided Config)
      const { libraryId, apiKey } = config;

      if (!libraryId || !apiKey) {
        return NextResponse.json({ 
          success: false, 
          message: "Please enter Library ID and API Key to test." 
        });
      }

      // Attempt to fetch videos (read-only check)
      const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos?page=1&itemsPerPage=1`, {
        method: "GET",
        headers: {
          "AccessKey": apiKey,
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return NextResponse.json({ success: false, message: "Bunny.net authentication failed. Check your API Key." });
        }
        if (response.status === 404) {
          return NextResponse.json({ success: false, message: "Bunny.net Library not found. Check your Library ID." });
        }
        return NextResponse.json({ 
          success: false, 
          message: `Bunny.net connection failed: ${response.status} ${response.statusText}` 
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: "Bunny.net connection successful!" 
      });
    }

    return NextResponse.json({ success: false, message: "Invalid test type" }, { status: 400 });

  } catch (error: any) {
    console.error("Test connection error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
