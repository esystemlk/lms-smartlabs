import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rateLimit";
import { getAdminApp } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

const ALLOWED_SENDER_ROLES = ["admin", "superadmin", "developer", "service"];

const schema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  link: z.string().max(500).optional(),
  targetRoles: z.array(z.string()).min(1),
});

export async function POST(req: Request) {
  try {
    const rl = rateLimit(req, "api/notifications/send", 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { title, message, link, targetRoles } = parsed.data;

    const adminApp = getAdminApp();
    const decoded = await getAuth(adminApp).verifyIdToken(idToken).catch(() => null);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const db = getFirestore(adminApp);
    const callerSnap = await db.collection("users").doc(decoded.uid).get();
    const callerRole = callerSnap.exists ? (callerSnap.data()?.role as string | undefined) : undefined;
    if (!callerRole || !ALLOWED_SENDER_ROLES.includes(callerRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const usersSnap = await db
      .collection("users")
      .where("role", "in", targetRoles.slice(0, 10))
      .get();

    const tokenToUser = new Map<string, string>();
    usersSnap.forEach((docSnap) => {
      const tokens = docSnap.data()?.fcmTokens as string[] | undefined;
      tokens?.forEach((t) => tokenToUser.set(t, docSnap.id));
    });

    const tokens = Array.from(tokenToUser.keys());
    if (tokens.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0 });
    }

    const messaging = getMessaging(adminApp);
    const staleTokensByUser = new Map<string, string[]>();
    let sent = 0;

    const batches: string[][] = [];
    for (let i = 0; i < tokens.length; i += 500) batches.push(tokens.slice(i, i + 500));

    for (const batch of batches) {
      const result = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: { title, body: message },
        data: link ? { link } : undefined,
        webpush: { fcmOptions: link ? { link } : undefined },
      });
      sent += result.successCount;
      result.responses.forEach((res, idx) => {
        if (res.success) return;
        const code = res.error?.code;
        if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
          const badToken = batch[idx];
          const uid = tokenToUser.get(badToken);
          if (uid) {
            const list = staleTokensByUser.get(uid) || [];
            list.push(badToken);
            staleTokensByUser.set(uid, list);
          }
        }
      });
    }

    await Promise.all(
      Array.from(staleTokensByUser.entries()).map(([uid, staleTokens]) =>
        db
          .collection("users")
          .doc(uid)
          .update({ fcmTokens: FieldValue.arrayRemove(...staleTokens) })
          .catch(() => null)
      )
    );

    return NextResponse.json({ sent, failed: tokens.length - sent });
  } catch (error) {
    console.error("Error sending push notification:", error);
    return NextResponse.json({ error: "Failed to send push notification" }, { status: 500 });
  }
}
