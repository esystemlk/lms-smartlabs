import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const merchant_id = formData.get('merchant_id') as string;
    const order_id = formData.get('order_id') as string;
    const payhere_amount = formData.get('payhere_amount') as string;
    const payhere_currency = formData.get('payhere_currency') as string;
    const status_code = formData.get('status_code') as string;
    const md5sig = formData.get('md5sig') as string;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchantSecret) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    // Verify Signature
    const hashedSecret = crypto
      .createHash('md5')
      .update(merchantSecret)
      .digest('hex')
      .toUpperCase();

    const localMd5sig = crypto
      .createHash('md5')
      .update(`${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${hashedSecret}`)
      .digest('hex')
      .toUpperCase();

    if (localMd5sig !== md5sig) {
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
    }

    if (status_code === '2') {
      // Payment Success
      // Ideally, update the database status to 'active' here using Firebase Admin SDK.
      // Since Admin SDK is not currently configured, we rely on the client-side 
      // return_url flow to trigger the final enrollment activation, 
      // but we verify the signature here for audit purposes.
      
      console.log(`Payment confirmed for Order ID: ${order_id}`);
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error("PayHere Notify Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
