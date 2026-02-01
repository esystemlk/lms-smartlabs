"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart2, Server, Globe, Cpu, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function SystemStatusPage() {
  const { userData, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!userData) {
        router.push("/login");
        return;
      }

      const allowedRoles = ["admin", "superadmin", "developer"];
      if (!allowedRoles.includes(userData.role || "")) {
        router.push("/dashboard");
      } else {
        setIsAuthorized(true);
      }
    }
  }, [userData, loading, router]);

  if (loading || !isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart2 className="text-brand-blue" size={32} />
            System Status
          </h1>
          <p className="text-gray-500 mt-1">Real-time performance monitoring and analytics</p>
        </div>
        <div className="flex gap-2">
            <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <Server size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Server Status</h3>
                    <p className="text-xs text-green-600 font-medium">Operational</p>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Uptime</span>
                    <span className="font-medium">99.98%</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Response Time</span>
                    <span className="font-medium">45ms</span>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Globe size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Network</h3>
                    <p className="text-xs text-blue-600 font-medium">Optimal</p>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Requests/min</span>
                    <span className="font-medium">1,240</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Bandwidth</span>
                    <span className="font-medium">45 MB/s</span>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <Cpu size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Database</h3>
                    <p className="text-xs text-purple-600 font-medium">Healthy</p>
                </div>
            </div>
             <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Reads/sec</span>
                    <span className="font-medium">850</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Writes/sec</span>
                    <span className="font-medium">120</span>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex items-start gap-4">
        <AlertTriangle className="text-yellow-600 flex-shrink-0" size={24} />
        <div>
            <h3 className="font-bold text-yellow-800">Maintenance Scheduled</h3>
            <p className="text-yellow-700 text-sm mt-1">
                Scheduled system maintenance will occur on Sunday at 02:00 AM UTC. Expect brief service interruptions.
            </p>
        </div>
      </div>
    </div>
  );
}
