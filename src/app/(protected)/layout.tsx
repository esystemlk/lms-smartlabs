"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { TitleBar } from "@/components/layout/TitleBar";
import { FloatingChatWidget } from "@/components/features/FloatingChatWidget";
import { NotificationListener } from "@/components/features/NotificationListener";
import { SuperLoader } from "@/components/ui/SuperLoader";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CommandPalette } from "@/components/features/CommandPalette";
import { PageTransition } from "@/components/layout/PageTransition";
import { ToastProvider } from "@/components/ui/Toast";
import { ScrollProgressBar } from "@/components/ui/ScrollProgressBar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { isCompact } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <SuperLoader text="Authenticating..." />;
  }

  if (!user) {
    return null; // Will redirect
  }

  const isDashboard = pathname === "/dashboard";
  const isLessonPage = pathname?.includes("/lessons/");

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background flex transition-colors duration-300 w-full relative overflow-x-hidden">
        <ScrollProgressBar />
        {/* Mobile Sidebar (Drawer) */}
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <div className="flex-1 flex flex-col min-h-screen">
          <TitleBar />
          <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
          <main className={clsx(
            "flex-1 max-w-7xl mx-auto w-full transition-all duration-300",
            // Base bottom padding for mobile nav
            "pb-28 md:pb-0",
            // Conditional padding: Remove padding for lesson pages to allow full-width video/content
            !isLessonPage && (isCompact ? "p-2 md:p-4" : "p-4 md:p-8")
          )}>
            <Breadcrumbs />
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
        <BottomNav />
        <FloatingChatWidget />
        <NotificationListener />
        <CommandPalette />
      </div>
    </ToastProvider>
  );
}
