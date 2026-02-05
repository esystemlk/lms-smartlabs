"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StorageManager } from "@/components/developer/StorageManager";
import { DatabaseManager } from "@/components/developer/DatabaseManager";
import { BunnyManager } from "@/components/developer/BunnyManager";
import { NotificationManager } from "@/components/developer/NotificationManager";
import { AdvancedSettingsManager } from "@/components/developer/AdvancedSettingsManager";
import { ImpersonationManager } from "@/components/developer/ImpersonationManager";
import { ShieldAlert, Database, HardDrive, Video, Bell, Settings, UserCog } from "lucide-react";

export default function DeveloperPage() {
  const { userData, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("database");

  useEffect(() => {
    if (!loading && userData?.role !== "developer") {
      // router.push("/dashboard"); 
      // Commented out strict redirect for testing if I can't simulate developer role easily, 
      // but in production code I should enable it. 
      // For now I'll redirect to dashboard as requested by "limited to see the developer role".
      router.push("/dashboard");
    }
  }, [userData, loading, router]);

  if (loading) {
    return (
       <div className="flex h-screen items-center justify-center">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
       </div>
    );
  }

  // Double check render protection
  if (userData?.role !== "developer") {
      return null;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="text-red-600" />
              Developer Console
            </h1>
            <p className="text-sm md:text-base text-gray-500">System internals and raw data management</p>
          </div>
       </div>

       {/* Tabs Navigation */}
       <div className="-mx-4 md:mx-0 px-4 md:px-0">
         <div className="flex overflow-x-auto border-b bg-white rounded-t-xl px-2 pb-1 md:pb-0 scrollbar-hide">
            <button
              onClick={() => setActiveTab("database")}
              className={`px-4 md:px-6 py-3 md:py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "database" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Database className="w-4 h-4" /> Firestore
            </button>
            <button
              onClick={() => setActiveTab("storage")}
              className={`px-4 md:px-6 py-3 md:py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "storage" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <HardDrive className="w-4 h-4" /> Storage
            </button>
            <button
              onClick={() => setActiveTab("bunny")}
              className={`px-4 md:px-6 py-3 md:py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "bunny" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Video className="w-4 h-4" /> Bunny.net
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-4 md:px-6 py-3 md:py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "notifications" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Bell className="w-4 h-4" /> Notifications
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 md:px-6 py-3 md:py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "settings" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
            <button
              onClick={() => setActiveTab("impersonation")}
              className={`px-4 md:px-6 py-3 md:py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "impersonation" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <UserCog className="w-4 h-4" /> Roles
            </button>
         </div>
       </div>

       {/* Tab Content */}
       <div className="min-h-[500px]">
          {activeTab === "database" && <DatabaseManager />}
          {activeTab === "storage" && <StorageManager />}
          {activeTab === "bunny" && <BunnyManager />}
          {activeTab === "notifications" && <NotificationManager />}
          {activeTab === "settings" && <AdvancedSettingsManager />}
          {activeTab === "impersonation" && <ImpersonationManager />}
       </div>
    </div>
  );
}
