import { NextResponse } from "next/server";
import { z } from "zod";
import { requireLeoKey } from "@/lib/leoAuth";
import { grantEnrollment } from "@/lib/leoEnrollmentAdmin";

const schema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  batchId: z.string().min(1),
  adminPhoneNumber: z.string().optional(),
});

export async function POST(req: Request) {
  const auth = requireLeoKey(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const enrollment = await grantEnrollment(
      parsed.data.studentId,
      parsed.data.courseId,
      parsed.data.batchId,
      parsed.data.adminPhoneNumber
    );
    return NextResponse.json({ enrollment });
  } catch (error) {
    console.error("LEO /enrollments/grant error:", error);
    const message = error instanceof Error ? error.message : "Failed to grant enrollment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
