"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminCoursesPage() {
    const router = useRouter();
    useEffect(() => { router.replace("/management?tab=courses"); }, [router]);
    return null;
}
