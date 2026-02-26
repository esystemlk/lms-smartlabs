import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rateLimit';
import { db } from '@/lib/firebase';
import { 
  doc, getDoc, updateDoc, serverTimestamp, writeBatch, arrayUnion, increment 
} from 'firebase/firestore';
import { Course, Enrollment } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const rl = rateLimit(req, 'api/payhere/notify', 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const formData = await req.formData();
    const merchant_id = formData.get('merchant_id') as string;
    const order_id = formData.get('order_id') as string;
    const payment_id = formData.get('payment_id') as string | null;
    const payhere_amount = formData.get('payhere_amount') as string;
    const payhere_currency = formData.get('payhere_currency') as string;
    const status_code = formData.get('status_code') as string;
    const md5sig = formData.get('md5sig') as string;
    if (!merchant_id || !order_id || !payhere_amount || !payhere_currency || !status_code || !md5sig) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Determine mode and credentials (mirror hash route logic)
    let mode: 'sandbox' | 'live' = 'sandbox';
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'global'));
      if (settingsSnap.exists()) {
        const data = settingsSnap.data() as any;
        if (data?.payhereMode === 'live') mode = 'live';
      }
    } catch {}
    const expectedMerchantId = mode === 'live'
      ? (process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID_LIVE || process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || '')
      : (process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID_SANDBOX || process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || '');
    if (!expectedMerchantId || merchant_id !== expectedMerchantId) {
      return NextResponse.json({ error: 'Merchant mismatch' }, { status: 400 });
    }
    const merchantSecret = mode === 'live'
      ? (process.env.PAYHERE_MERCHANT_SECRET_LIVE || process.env.PAYHERE_MERCHANT_SECRET)
      : (process.env.PAYHERE_MERCHANT_SECRET_SANDBOX || process.env.PAYHERE_MERCHANT_SECRET);

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
      // Payment Success — finalize enrollment atomically
      const enrollmentRef = doc(db, 'enrollments', order_id);
      const enrollmentSnap = await getDoc(enrollmentRef);
      if (!enrollmentSnap.exists()) {
        return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
      }
      const enrollment = enrollmentSnap.data() as Enrollment;
      if (enrollment.status === 'active') {
        return NextResponse.json({ status: 'already_active' });
      }
      // Validate amount matches (2dp)
      const expected = Number(enrollment.amount || 0).toFixed(2);
      const received = Number(parseFloat(payhere_amount)).toFixed(2);
      if (expected !== received) {
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
      }
      // Compute validity like approveEnrollment
      const courseRef = doc(db, 'courses', enrollment.courseId);
      const courseSnap = await getDoc(courseRef);
      const course = courseSnap.data() as Course;
      let validUntil: any = null;
      if (course) {
        const { addMonths, parseISO, isBefore } = await import('date-fns');
        let expiryDate: Date | null = null;
        if (course.resourceAvailabilityMonths) {
          expiryDate = addMonths(new Date(), course.resourceAvailabilityMonths);
        }
        if (course.endDate) {
          const courseEndDate = parseISO(course.endDate);
          if (!expiryDate || isBefore(courseEndDate, expiryDate)) {
            expiryDate = courseEndDate;
          }
        }
        if (expiryDate) {
          const { Timestamp } = await import('firebase/firestore');
          // @ts-ignore
          validUntil = Timestamp.fromDate(expiryDate);
        }
      }
      const batch = writeBatch(db);
      // Update enrollment
      batch.update(enrollmentRef, {
        status: 'active',
        validUntil,
        paymentMethod: 'payhere',
        paymentProofUrl: payment_id || null,
        updatedAt: serverTimestamp()
      });
      // Update user
      batch.update(doc(db, 'users', enrollment.userId), {
        enrolledBatches: arrayUnion(enrollment.batchId),
        enrolledCourses: arrayUnion(enrollment.courseId)
      });
      // Update batch count
      batch.update(doc(db, 'courses', enrollment.courseId, 'batches', enrollment.batchId), {
        enrolledCount: increment(1)
      });
      // Update timeslot counts: decrement reserved, increment enrolled
      if (enrollment.timeSlotId) {
        const batchRef = doc(db, 'courses', enrollment.courseId, 'batches', enrollment.batchId);
        const batchSnap = await getDoc(batchRef);
        if (batchSnap.exists()) {
          const data = batchSnap.data() as any;
          const slots = (data.timeSlots || []).map((s: any) => {
            if (s.id === enrollment.timeSlotId) {
              return {
                ...s,
                reservedCount: Math.max(0, (s.reservedCount || 0) - 1),
                enrolledCount: (s.enrolledCount || 0) + 1
              };
            }
            return s;
          });
          batch.update(batchRef, { timeSlots: slots });
        }
      }
      await batch.commit();
      return NextResponse.json({ status: 'activated' });
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error("PayHere Notify Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
