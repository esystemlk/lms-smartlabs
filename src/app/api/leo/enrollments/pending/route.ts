import { NextResponse } from "next/server";
import { requireLeoKey } from "@/lib/leoAuth";
import { getPendingEnrollments } from "@/lib/leoEnrollmentAdmin";

export async function GET(req: Request) {
  const auth = requireLeoKey(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const enrollments = await getPendingEnrollments();
    return NextResponse.json({ enrollments });
  } catch (error) {
    console.error("LEO /enrollments/pending error:", error);
    return NextResponse.json({ error: "Failed to list pending enrollments" }, { status: 500 });
  }
}
