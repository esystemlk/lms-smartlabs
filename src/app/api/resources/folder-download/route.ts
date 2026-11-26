import { NextResponse } from "next/server";
import { getStorage } from "firebase-admin/storage";
import { getCaller } from "@/lib/recordingPackages.server";
import { getAdminApp } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const SITE_ORIGINS = ["https://lms.smartlabs.lk", "http://localhost:3000"];
let corsChecked = false;

/**
 * The browser fetches each file straight from Firebase Storage to build the ZIP, which needs the bucket
 * to allow GET from the LMS site (CORS). Adds that rule once, keeping any rules the bucket already has.
 */
async function ensureStorageCors() {
  if (corsChecked) return;
  const bucket = getStorage(getAdminApp()).bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
  const [meta] = await bucket.getMetadata();
  const cors = (meta.cors || []) as { origin?: string[]; method?: string[]; responseHeader?: string[]; maxAgeSeconds?: number }[];
  const covered = SITE_ORIGINS.every(o => cors.some(c => (c.origin || []).some(x => x === o || x === "*") && (c.method || []).includes("GET")));
  if (!covered) {
    await bucket.setCorsConfiguration([...cors, { origin: SITE_ORIGINS, method: ["GET", "HEAD"], responseHeader: ["Content-Type", "Content-Length"], maxAgeSeconds: 3600 }]);
  }
  corsChecked = true;
}

/**
 * GET ?folderId=<id>  or  ?courseId=<id> (that course's top level)
 * Developer only: the full file list of a resources folder and every folder inside it, with paths,
 * so the browser can fetch the files and pack them into one ZIP. Admins, lecturers and students get 403.
 */
export async function GET(req: Request) {
  const caller = await getCaller(req);
  if (!caller.ok) return NextResponse.json({ error: caller.error }, { status: caller.status });
  if (caller.role !== "developer") return NextResponse.json({ error: "Bulk download is for developers only." }, { status: 403 });

  try { await ensureStorageCors(); }
  catch (e) { console.error("[folder-download] could not set Storage CORS:", e); return NextResponse.json({ error: "Storage is not set up for bulk download yet (CORS). Check the server logs." }, { status: 500 }); }

  const url = new URL(req.url);
  const folderId = url.searchParams.get("folderId");
  const courseId = url.searchParams.get("courseId");
  const db = caller.db;
  const safe = (s: string) => String(s || "untitled").replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_").trim().slice(0, 120) || "untitled";

  const files: { path: string; url: string }[] = [];
  const links: string[] = [];
  const seen = new Set<string>();

  const addResources = (docs: FirebaseFirestore.QueryDocumentSnapshot[], dir: string) => {
    const used = new Set<string>();
    for (const d of docs) {
      const r = d.data();
      if (!r.url) continue;
      if (!/^https:\/\/firebasestorage\.googleapis\.com\//.test(r.url)) { links.push(`${dir}${r.title || "Link"}: ${r.url}`); continue; }
      // Keep the file's extension from its storage name; make names unique inside a folder.
      const ext = (decodeURIComponent(r.url.split("?")[0]).match(/\.([a-z0-9]{1,6})$/i)?.[1] || "").toLowerCase();
      let name = safe(r.title);
      if (ext && !name.toLowerCase().endsWith("." + ext)) name += "." + ext;
      let n = 2;
      const base = name;
      while (used.has(name.toLowerCase())) name = base.replace(/(\.[^.]+)?$/, ` (${n++})$1`);
      used.add(name.toLowerCase());
      files.push({ path: dir + name, url: r.url });
    }
  };

  // Depth-first walk; `seen` guards against a folder loop in the data.
  const walk = async (id: string, dir: string, depth: number) => {
    if (seen.has(id) || depth > 12 || files.length > 5000) return;
    seen.add(id);
    const [res, subs] = await Promise.all([
      db.collection("resources").where("folderId", "==", id).get(),
      db.collection("folders").where("parentId", "==", id).get(),
    ]);
    addResources(res.docs, dir);
    for (const s of subs.docs) await walk(s.id, `${dir}${safe(s.data().name)}/`, depth + 1);
  };

  let zipName = "resources";
  if (folderId) {
    const f = await db.collection("folders").doc(folderId).get();
    if (!f.exists) return NextResponse.json({ error: "Folder not found." }, { status: 404 });
    zipName = safe(f.data()!.name);
    await walk(folderId, "", 0);
  } else if (courseId) {
    const c = await db.collection("courses").doc(courseId).get();
    zipName = safe(c.data()?.title || "course") + " - resources";
    const [res, tops] = await Promise.all([
      db.collection("resources").where("courseId", "==", courseId).get(),
      db.collection("folders").where("courseId", "==", courseId).get(),
    ]);
    addResources(res.docs.filter(d => !d.data().folderId), "");
    for (const t of tops.docs.filter(d => !d.data().parentId)) await walk(t.id, `${safe(t.data().name)}/`, 0);
  } else {
    return NextResponse.json({ error: "folderId or courseId is required." }, { status: 400 });
  }

  return NextResponse.json({ zipName, files, links }, { headers: { "Cache-Control": "no-store" } });
}
