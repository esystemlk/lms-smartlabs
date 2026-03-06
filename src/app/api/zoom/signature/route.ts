import { NextResponse } from 'next/server';
import { KJUR } from 'jsrsasign';
import { rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const rl = rateLimit(req, 'api/zoom/signature', 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const schema = z.object({
      meetingNumber: z.union([z.string(), z.number()]),
      role: z.number().int().min(0).max(1).optional()
    });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const meetingNumber = String(parsed.data.meetingNumber);
    const role = parsed.data.role ?? 0;

    // Meeting SDK credentials are removed from settings by design.
    // We disable signature generation to enforce S2S OAuth and native Zoom join.
    return NextResponse.json({ error: "Zoom Meeting SDK is disabled. Use native Zoom links or S2S OAuth for server actions." }, { status: 400 });
    

  } catch (error: any) {
    console.error("Signature Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

