import { NextResponse } from "next/server";
import { requireLeoKey } from "@/lib/leoAuth";
import { listPublishedCoursesWithBatches } from "@/lib/leoEnrollmentAdmin";

export async function GET(req: Request) {
  const auth = requireLeoKey(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const courses = await listPublishedCoursesWithBatches();
    return NextResponse.json({ courses });
  } catch (error) {
    console.error("LEO /courses error:", error);
    return NextResponse.json({ error: "Failed to list courses" }, { status: 500 });
  }
}
