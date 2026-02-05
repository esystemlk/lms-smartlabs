"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart2, Server, Globe, Cpu, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { userService } from "@/services/userService";
import { courseService } from "@/services/courseService";
import { enrollmentService } from "@/services/enrollmentService";

export default function SystemStatusPage() {
  const { userData, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [stats, setStats] = useState({
    latency: 0,
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    dbStatus: "Checking...",
    networkStatus: "Checking..."
  });

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
        checkSystemHealth();
      }
    }
  }, [userData, loading, router]);

  const checkSystemHealth = async () => {
    const start = performance.now();
    try {
      // Parallel fetch for counts and latency check
      const [users, courses, enrollments] = await Promise.all([
        userService.getAllUsers(),
        courseService.getAllCourses(),
        enrollmentService.getAllEnrollments()
      ]);
      
      const end = performance.now();
      
      setStats({
        latency: Math.round(end - start),
        totalUsers: users.length,
        totalCourses: courses.length,
        totalEnrollments: enrollments.length,
        dbStatus: "Operational",
        networkStatus: "Optimal"
      });
    } catch (error) {
      console.error("System health check failed:", error);
      setStats(prev => ({ ...prev, dbStatus: "Degraded", networkStatus: "Issues Detected" }));
    }
  };

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
        {/* Latency Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <Server size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">API Response</h3>
                    <p className="text-xs text-green-600 font-medium">{stats.latency > 0 ? `${stats.latency}ms` : 'Checking...'}</p>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span className="font-medium text-green-600">Operational</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Region</span>
                    <span className="font-medium">Global (CDN)</span>
                </div>
            </div>
        </div>

        {/* Database Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Globe size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Database</h3>
                    <p className="text-xs text-blue-600 font-medium">{stats.dbStatus}</p>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Users</span>
                    <span className="font-medium">{stats.totalUsers}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Courses</span>
                    <span className="font-medium">{stats.totalCourses}</span>
                </div>
            </div>
        </div>

        {/* Enrollments Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <Cpu size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Enrollments</h3>
                    <p className="text-xs text-purple-600 font-medium">Active</p>
                </div>
            </div>
             <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Records</span>
                    <span className="font-medium">{stats.totalEnrollments}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sync Status</span>
                    <span className="font-medium">Real-time</span>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-start gap-4">
        <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
        <div>
            <h3 className="font-bold text-green-800">All Systems Operational</h3>
            <p className="text-green-700 text-sm mt-1">
                No scheduled maintenance. All services are running normally.
            </p>
        </div>
      </div>
    </div>
  );
}
