"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminAnalyticsPage() {
    const router = useRouter();
    useEffect(() => { router.replace("/management?tab=analytics"); }, [router]);
    return null;
}
