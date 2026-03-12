"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminEnrollmentsPage() {
    const router = useRouter();
    useEffect(() => { router.replace("/management?tab=enrollments"); }, [router]);
    return null;
}
