"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LecturerHubRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/live-classes");
  }, [router]);

  return null;
}
