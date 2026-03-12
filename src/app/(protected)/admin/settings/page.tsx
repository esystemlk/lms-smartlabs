"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminSettingsPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/management?tab=settings"); }, [router]);
  return null;
}