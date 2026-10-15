import { cert, getApps, initializeApp, type App } from "firebase-admin/app";

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;

  const parsed = JSON.parse(raw);
  // Vercel/.env escape newlines in the private key as literal "\n".
  if (typeof parsed.private_key === "string") {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }
  return parsed;
}

let adminApp: App | null = null;

export function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set");
  }

  adminApp = initializeApp({ credential: cert(serviceAccount) });
  return adminApp;
}
