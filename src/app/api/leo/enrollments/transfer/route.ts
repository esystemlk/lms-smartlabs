import { NextResponse } from "next/server";
import { z } from "zod";
import { requireLeoKey } from "@/lib/leoAuth";
import { transferEnrollment } from "@/lib/leoEnrollmentAdmin";

const schema = z.object({
  studentId: z.string().min(1),
  fromCourseId: z.string().min(1),
  toCourseId: z.string().min(1),
  toBatchId: z.string().min(1),
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
    // Atomic: bans the old enrollment and grants the new one in one Firestore
    // batch, so a failure never leaves a student in both or neither course.
    const enrollment = await transferEnrollment(
      parsed.data.studentId,
      parsed.data.fromCourseId,
      parsed.data.toCourseId,
      parsed.data.toBatchId,
      parsed.data.adminPhoneNumber
    );
    return NextResponse.json({ enrollment });
  } catch (error) {
    console.error("LEO /enrollments/transfer error:", error);
    const message = error instanceof Error ? error.message : "Failed to transfer enrollment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
