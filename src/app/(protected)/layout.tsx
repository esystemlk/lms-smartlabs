"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TitleBar } from "@/components/layout/TitleBar";
import { FloatingChatWidget } from "@/components/features/FloatingChatWidget";
import { NotificationListener } from "@/components/features/NotificationListener";
import { SuperLoader } from "@/components/ui/SuperLoader";
import { Loader2, Megaphone, AlertTriangle, X, UserCog, LogOut } from "lucide-react";
import { clsx } from "clsx";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CommandPalette } from "@/components/features/CommandPalette";
import { PageTransition } from "@/components/layout/PageTransition";
import { ScrollProgressBar } from "@/components/ui/ScrollProgressBar";
import { ProfileCompletionModal } from "@/components/features/ProfileCompletionModal";
import { settingsService } from "@/services/settingsService";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, loading, isImpersonating, stopImpersonating, originalRole } = useAuth();
  const { isCompact } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<string>("");
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [hideBanner, setHideBanner] = useState<boolean>(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const s = await settingsService.getSettings();
        setAnnouncement(s.announcement || "");
        setMaintenanceMode(!!s.maintenanceMode);
      } catch (e) {
        // ignore banner on failure
      }
    };
    loadSettings();
  }, []);

  if (loading) {
    return <SuperLoader text="Authenticating..." />;
  }

  if (!user) {
    return null; // Will redirect
  }

  const isDashboard = pathname === "/dashboard";
  const isLessonPage = pathname?.includes("/lessons/");
  const isAdmin = ["admin", "superadmin", "developer"].includes((user as any)?.role || "");

  // Maintenance Mode Blocking
  if (!isAdmin && maintenanceMode && !isImpersonating) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 animate-pulse">
            <AlertTriangle size={40} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">System Under Maintenance</h1>
            <p className="text-gray-500">
              We are currently upgrading the system to provide you with a better learning experience. 
              Please check back later.
            </p>
          </div>
          {announcement && (
             <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm font-medium">
               "{announcement}"
             </div>
          )}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">Error Code: MAINTENANCE_MODE_ACTIVE</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300 w-full relative overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] opacity-50 mix-blend-multiply dark:mix-blend-screen animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] opacity-50 mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
        </div>
      </div>

      <div className="relative z-10 flex w-full">
        {userData && <ProfileCompletionModal user={userData} />}
        <ScrollProgressBar />
        {/* Mobile Sidebar (Drawer) */}
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <div className="flex-1 flex flex-col min-h-screen">
          <TitleBar />
          
          {/* Impersonation Banner */}
          {isImpersonating && (
            <div className="bg-purple-600 text-white px-4 py-2 flex items-center justify-between shadow-md relative z-50">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1 rounded">
                  <UserCog className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">
                  Viewing as <strong>{(user as any)?.role}</strong> (Actual: {originalRole})
                </span>
              </div>
              <button
                onClick={stopImpersonating}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3 h-3" />
                Exit View
              </button>
            </div>
          )}

          <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
          {!hideBanner && (announcement || (!isAdmin && maintenanceMode)) && (
            <div className="max-w-7xl mx-auto w-full px-4 md:px-8 mt-2">
              {announcement && (
                <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-3 md:p-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-sm md:text-base">
                    {announcement}
                  </div>
                  <button
                    onClick={() => setHideBanner(true)}
                    className="text-yellow-700 hover:text-yellow-900 p-1 rounded-md"
                    aria-label="Dismiss announcement"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {!isAdmin && maintenanceMode && (
                <div className="mt-2 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 md:p-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-sm md:text-base">
                    The system is undergoing maintenance. Some features may be unavailable.
                  </div>
                  <button
                    onClick={() => setHideBanner(true)}
                    className="text-red-700 hover:text-red-900 p-1 rounded-md"
                    aria-label="Dismiss maintenance notice"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
          <main className={clsx(
            "flex-1 max-w-7xl mx-auto w-full transition-all duration-300",
            // Conditional padding: Remove padding for lesson pages to allow full-width video/content
            !isLessonPage && (isCompact ? "p-2 md:p-4" : "p-4 md:p-8")
          )}>
            <Breadcrumbs />
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
        <FloatingChatWidget />
        <NotificationListener />
        <CommandPalette />
      </div>
    </div>
  );
}
