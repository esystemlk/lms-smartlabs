import { NextResponse } from 'next/server';
import { KJUR } from 'jsrsasign';

export async function POST(req: Request) {
  try {
    const { meetingNumber, role } = await req.json();

    // Use SDK-specific credentials (Meeting SDK App)
    const ZOOM_SDK_KEY = process.env.ZOOM_SDK_CLIENT_ID;
    const ZOOM_SDK_SECRET = process.env.ZOOM_SDK_CLIENT_SECRET;

    if (!ZOOM_SDK_KEY || !ZOOM_SDK_SECRET) {
      return NextResponse.json({ error: "Zoom SDK credentials missing (ZOOM_SDK_CLIENT_ID/SECRET)" }, { status: 500 });
    }

    // Generate Signature
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;

    const oHeader = { alg: 'HS256', typ: 'JWT' };
    
    // Zoom Meeting SDK Payload
    // mn must be matching what is passed to join()
    // role: 0 (attendee), 1 (host)
    const oPayload = {
      sdkKey: ZOOM_SDK_KEY,
      mn: meetingNumber, 
      role: role || 0,
      iat: iat,
      exp: exp,
      tokenExp: exp
    };

    const sHeader = JSON.stringify(oHeader);
    const sPayload = JSON.stringify(oPayload);
    const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, ZOOM_SDK_SECRET);

    return NextResponse.json({ signature, sdkKey: ZOOM_SDK_KEY });

  } catch (error: any) {
    console.error("Signature Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

