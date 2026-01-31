"use client";

import { Fragment, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { VoiceNavigator } from "@/components/features/VoiceNavigator";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { InstallPrompt } from "@/components/features/InstallPrompt";
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Bell,
  Menu as MenuIcon,
  ChevronLeft,
  Home,
  LayoutDashboard,
  Download
} from "lucide-react";
import { clsx } from "clsx";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
  
  const { isInstallable, promptInstall } = usePWAInstall();
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  const handleInstallClick = async () => {
    const outcome = await promptInstall();
    if (outcome === 'ios') {
      setShowIOSPrompt(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      case "superadmin": return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800";
      case "lecturer": return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      case "developer": return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
      default: return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"; // student/user
    }
  };

  return (
    <header className="bg-card border-b border-border h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 transition-colors duration-300">
      {/* Left Section: Navigation & Mobile Menu */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Trigger */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <MenuIcon size={24} />
        </button>

        {/* Back & Home Buttons (Visible on all screens except Dashboard) */}
        {!isDashboard && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => router.back()}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1"
              title="Go Back"
            >
              <ChevronLeft size={20} />
              <span className="hidden sm:inline text-sm font-medium">Back</span>
            </button>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-brand-blue dark:hover:text-brand-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-1"
              title="Main Menu"
            >
              <Home size={20} />
              <span className="hidden sm:inline text-sm font-medium">Main Menu</span>
            </button>
          </div>
        )}

        {/* Brand Name (Only visible on Dashboard or if buttons are hidden) */}
        {isDashboard && (
          <span className="font-bold text-lg text-foreground md:hidden">SMART LABS</span>
        )}
      </div>

      <div className="flex-1 hidden md:flex">
        {/* Search bar or breadcrumbs could go here */}
      </div>

      <div className="flex items-center gap-4">
        {/* Install App Button */}
        {isInstallable && (
          <button 
            onClick={handleInstallClick}
            className="flex items-center gap-2 p-2 md:px-3 md:py-1.5 text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-colors animate-in fade-in"
            title="Install App"
          >
            <Download size={20} />
            <span className="hidden md:inline font-medium text-sm">Install App</span>
          </button>
        )}

        {/* Voice Navigation */}
        <VoiceNavigator />

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-50">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-gray-200 mx-1"></div>

        {/* User Profile Dropdown */}
        <Menu as="div" className="relative ml-3">
          <Menu.Button className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl transition-colors outline-none">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-semibold text-gray-900 leading-none">
                {userData?.name || "User"}
              </span>
              <span className={clsx(
                "text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border mt-1",
                getRoleBadgeColor(userData?.role)
              )}>
                {userData?.role || "Student"}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm relative overflow-hidden">
               {userData?.photoURL ? (
                 <Image src={userData.photoURL} alt={userData.name} fill className="object-cover" />
               ) : (
                 <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-bold text-lg">
                   {userData?.name?.charAt(0).toUpperCase() || "U"}
                 </div>
               )}
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100 z-50">
              <div className="p-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={clsx(
                        active ? 'bg-gray-50 text-brand-blue' : 'text-gray-700',
                        'group flex w-full items-center rounded-lg px-2 py-2 text-sm'
                      )}
                      onClick={() => router.push('/profile')}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={clsx(
                        active ? 'bg-gray-50 text-brand-blue' : 'text-gray-700',
                        'group flex w-full items-center rounded-lg px-2 py-2 text-sm'
                      )}
                      onClick={() => router.push('/settings')}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </button>
                  )}
                </Menu.Item>
              </div>
              <div className="p-1">
                {userData?.role === "admin" && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={clsx(
                          active ? 'bg-gray-50 text-brand-blue' : 'text-gray-700',
                          'group flex w-full items-center rounded-lg px-2 py-2 text-sm'
                        )}
                        onClick={() => router.push('/admin')}
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </button>
                    )}
                  </Menu.Item>
                )}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={clsx(
                        active ? 'bg-red-50 text-red-600' : 'text-red-600',
                        'group flex w-full items-center rounded-lg px-2 py-2 text-sm'
                      )}
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      <InstallPrompt 
        isOpen={showIOSPrompt} 
        onClose={() => setShowIOSPrompt(false)} 
        platform="ios" 
      />
    </header>
  );
}