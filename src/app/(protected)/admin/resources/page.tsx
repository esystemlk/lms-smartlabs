"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminResourcesPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/management?tab=resources"); }, [router]);
  return null;
}
