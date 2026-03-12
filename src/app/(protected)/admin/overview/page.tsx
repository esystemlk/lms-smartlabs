"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminOverviewPage() {
    const router = useRouter();
    useEffect(() => { router.replace("/management?tab=dashboard"); }, [router]);
    return null;
}
