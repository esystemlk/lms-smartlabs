import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST() {
  try {
    const ref = doc(db, 'settings', 'global');
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return NextResponse.json({ success: false, error: 'Settings not found' }, { status: 400 });
    }
    const data = snap.data() as any;
    const accountId = data?.zoom?.serverToServer?.accountId;
    const clientId = data?.zoom?.serverToServer?.clientId;
    const clientSecret = data?.zoom?.serverToServer?.clientSecret;
    if (!accountId || !clientId || !clientSecret) {
      return NextResponse.json({ success: false, error: 'Zoom credentials are incomplete in settings' }, { status: 400 });
    }
    const tokenRes = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      }
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson?.access_token) {
      return NextResponse.json({ success: false, error: 'Failed to obtain Zoom token', details: tokenJson }, { status: 500 });
    }
    // Optional: simple API ping to verify token
    const meRes = await fetch('https://api.zoom.us/v2/users/me', {
      headers: { 'Authorization': `Bearer ${tokenJson.access_token}` }
    });
    const ok = meRes.ok;
    return NextResponse.json({ success: ok, error: ok ? undefined : 'Token valid but API call failed' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Unknown error' }, { status: 500 });
  }
}
