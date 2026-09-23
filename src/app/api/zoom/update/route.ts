import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

/**
 * Update an existing Zoom meeting (topic / start time / duration) so an edited
 * scheduled class stays in sync with Zoom. Best-effort: the caller should still
 * update Firestore even if this returns an error (e.g. the meeting was deleted
 * in Zoom), but it will surface the real reason.
 */
export async function POST(req: Request) {
  try {
    const rl = rateLimit(req, 'api/zoom/update', 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const schema = z.object({
      meetingId: z.union([z.string(), z.number()]),
      topic: z.string().min(1).max(200).optional(),
      startTime: z.string().datetime().optional(),
      duration: z.number().int().positive().optional(),
      agenda: z.string().max(1000).optional(),
    });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const { meetingId, topic, startTime, duration, agenda } = parsed.data;

    const { db } = await import('@/lib/firebase');
    const { doc, getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(db, 'settings', 'global'));
    const zoomCfg = snap.exists() ? (snap.data() as any)?.zoom?.serverToServer : null;
    const accountId = zoomCfg?.accountId as string | undefined;
    const clientId = zoomCfg?.clientId as string | undefined;
    const clientSecret = zoomCfg?.clientSecret as string | undefined;

    if (!accountId || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Zoom credentials missing. Configure them in Developer Settings.' },
        { status: 500 }
      );
    }

    // Access token
    const params = new URLSearchParams();
    params.set('grant_type', 'account_credentials');
    params.set('account_id', String(accountId));
    const tokenRes = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      const reason = tokenData?.reason || tokenData?.error || JSON.stringify(tokenData);
      return NextResponse.json({ error: `Zoom auth failed: ${reason}` }, { status: 502 });
    }

    const body: Record<string, unknown> = {};
    if (topic) body.topic = topic;
    if (startTime) body.start_time = startTime;
    if (duration) body.duration = duration;
    if (agenda !== undefined) body.agenda = agenda;

    const res = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Zoom returns 204 No Content on success.
    if (res.status === 204) {
      return NextResponse.json({ success: true });
    }
    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: `Failed to update Zoom meeting: ${errData?.message || res.status}`, code: errData?.code },
      { status: 502 }
    );
  } catch (error: any) {
    console.error('Zoom Update Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
