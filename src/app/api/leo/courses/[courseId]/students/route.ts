import { NextResponse } from "next/server";
import { requireLeoKey } from "@/lib/leoAuth";
import { getCourseRoster } from "@/lib/leoEnrollmentAdmin";

export async function GET(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const auth = requireLeoKey(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { courseId } = await params;
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId") || undefined;
  const status = searchParams.get("status") || undefined;
  const cursor = searchParams.get("cursor") || undefined;

  try {
    const roster = await getCourseRoster(courseId, { batchId, status, cursor });
    return NextResponse.json(roster);
  } catch (error) {
    console.error("LEO /courses/:courseId/students error:", error);
    const message = error instanceof Error ? error.message : "Failed to list course roster";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
