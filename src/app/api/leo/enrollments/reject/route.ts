import { NextResponse } from "next/server";
import { z } from "zod";
import { requireLeoKey } from "@/lib/leoAuth";
import { rejectEnrollment } from "@/lib/leoEnrollmentAdmin";

const schema = z.object({
  enrollmentId: z.string().min(1),
  adminPhoneNumber: z.string().optional(),
  reason: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const auth = requireLeoKey(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const enrollment = await rejectEnrollment(
      parsed.data.enrollmentId,
      parsed.data.adminPhoneNumber,
      parsed.data.reason
    );
    return NextResponse.json({ enrollment });
  } catch (error) {
    console.error("LEO /enrollments/reject error:", error);
    const message = error instanceof Error ? error.message : "Failed to reject enrollment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
