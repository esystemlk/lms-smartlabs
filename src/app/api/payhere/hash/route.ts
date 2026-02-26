import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const rl = rateLimit(req, 'api/payhere/hash', 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const schema = z.object({
      order_id: z.string().min(1),
      amount: z.union([z.string(), z.number()]),
      currency: z.string().min(2).max(5)
    });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const { order_id, amount, currency } = parsed.data;
    
    // Determine mode from global settings (defaults to sandbox)
    let mode: 'sandbox' | 'live' = 'sandbox';
    try {
      const ref = doc(db, 'settings', 'global');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as any;
        if (data?.payhereMode === 'live') mode = 'live';
      }
    } catch {}

    // Pick credentials based on mode (with fallback to legacy env names)
    const merchantId = mode === 'live' 
      ? (process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID_LIVE || process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID)
      : (process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID_SANDBOX || process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID);
    const merchantSecret = mode === 'live'
      ? (process.env.PAYHERE_MERCHANT_SECRET_LIVE || process.env.PAYHERE_MERCHANT_SECRET)
      : (process.env.PAYHERE_MERCHANT_SECRET_SANDBOX || process.env.PAYHERE_MERCHANT_SECRET);

    if (!merchantId || !merchantSecret) {
      return NextResponse.json(
        { error: 'Server configuration error: Merchant credentials missing' }, 
        { status: 500 }
      );
    }

    // Format amount to 2 decimal places
    const amountNum = typeof amount === 'number' ? amount : parseFloat(amount);
    const amountFormatted = amountNum.toFixed(2);
    
    // Hash generation as per PayHere documentation:
    // 1. Hash the merchant secret (md5) -> upperCase
    // 2. Hash (merchant_id + order_id + amount_formatted + currency + hashed_secret) -> upperCase
    
    const hashedSecret = crypto
      .createHash('md5')
      .update(merchantSecret)
      .digest('hex')
      .toUpperCase();

    const hashString = `${merchantId}${order_id}${amountFormatted}${currency}${hashedSecret}`;
    
    const hash = crypto
      .createHash('md5')
      .update(hashString)
      .digest('hex')
      .toUpperCase();

    return NextResponse.json({ hash });
  } catch (error) {
    console.error("PayHere Hash Error:", error);
    return NextResponse.json({ error: 'Failed to generate hash' }, { status: 500 });
  }
}
