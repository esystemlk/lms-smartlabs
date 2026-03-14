"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRecordingsRedirectPage() {
  const router = useRouter();
  useEffect(() => { 
    router.replace("/management?tab=recordings"); 
  }, [router]);
  return null;
}
