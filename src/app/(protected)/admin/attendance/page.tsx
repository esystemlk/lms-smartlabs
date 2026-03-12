"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminAttendancePage() {
  const router = useRouter();
  useEffect(() => { router.replace("/management?tab=attendance"); }, [router]);
  return null;
}
