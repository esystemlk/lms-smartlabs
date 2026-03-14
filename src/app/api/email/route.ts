import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { adminDb } from '@/lib/firebase-admin'; // Using admin db for server-side

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { to, subject, html } = body;

        // Fetch SMTP settings from Firestore
        const settingsDoc = await adminDb.collection('settings').doc('global').get();

        if (!settingsDoc.exists) {
            return NextResponse.json({ success: false, error: 'Settings not configured' }, { status: 400 });
        }

        const settings = settingsDoc.data();
        const smtpEmail = settings?.smtp?.email;
        const smtpPassword = settings?.smtp?.appPassword;

        if (!smtpEmail || !smtpPassword) {
            return NextResponse.json({ success: false, error: 'SMTP credentials not configured in admin portal' }, { status: 400 });
        }

        // Set up Nodemailer transport
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Assuming Gmail for app passwords, but can be updated
            auth: {
                user: smtpEmail,
                pass: smtpPassword,
            },
        });

        const mailOptions = {
            from: `"${settings.siteName || 'LMS System'}" <${smtpEmail}>`,
            to: to || settings.adminEmails, // Use provided 'to' or fallback to adminEmails
            subject,
            html,
        };

        if (!mailOptions.to) {
            return NextResponse.json({ success: false, error: 'No recipient email specified' }, { status: 400 });
        }

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, message: 'Email sent successfully' }, { status: 200 });
    } catch (error: any) {
        console.error('Email API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
