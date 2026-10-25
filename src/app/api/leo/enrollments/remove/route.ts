import { NextResponse } from "next/server";
import { z } from "zod";
import { requireLeoKey } from "@/lib/leoAuth";
import { removeEnrollment } from "@/lib/leoEnrollmentAdmin";

const schema = z.object({
  enrollmentId: z.string().min(1),
  adminPhoneNumber: z.string().optional(),
  hard: z.boolean().optional(),
});

export async function POST(req: Request) {
  const auth = requireLeoKey(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    // Default is reversible (ban): keeps payment/progress history, blocks access.
    // { hard: true } performs a real delete — nothing on the WhatsApp side should
    // request this by default.
    const result = await removeEnrollment(
      parsed.data.enrollmentId,
      parsed.data.hard === true,
      parsed.data.adminPhoneNumber
    );
    return NextResponse.json({ enrollment: result });
  } catch (error) {
    console.error("LEO /enrollments/remove error:", error);
    const message = error instanceof Error ? error.message : "Failed to remove enrollment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
