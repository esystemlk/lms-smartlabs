import { NextResponse } from "next/server";
import { requireLeoKey } from "@/lib/leoAuth";
import { findStudents } from "@/lib/leoEnrollmentAdmin";

export async function GET(req: Request) {
  const auth = requireLeoKey(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  try {
    const students = await findStudents(q);
    return NextResponse.json({ students });
  } catch (error) {
    console.error("LEO /students error:", error);
    return NextResponse.json({ error: "Failed to search students" }, { status: 500 });
  }
}
