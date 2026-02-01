"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && userData) {
      const allowedRoles = ["admin", "superadmin", "developer"];
      if (!allowedRoles.includes(userData.role)) {
        router.push("/dashboard");
      }
    }
  }, [userData, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!userData) return null;

  return <AdminDashboard />;
}
