"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminSupportPage() {
    const router = useRouter();
    useEffect(() => { router.replace("/management?tab=support"); }, [router]);
    return null;
}
