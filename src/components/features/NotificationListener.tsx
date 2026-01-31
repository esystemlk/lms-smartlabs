"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { chatService } from "@/services/chatService";
import { SupportChat } from "@/lib/types";
import { Bell, X } from "lucide-react";

export function NotificationListener() {
  const { userData } = useAuth();
  const router = useRouter();
  const prevChatsRef = useRef<Record<string, number>>({});
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
      if (Notification.permission === "default") {
        setShowPermissionBanner(true);
      }
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        setShowPermissionBanner(false);
        new Notification("Notifications Enabled", {
          body: "You will now receive alerts for new messages.",
          icon: "/icons/icon-192x192.png"
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  useEffect(() => {
    if (!userData) return;

    let unsubscribe: () => void;

    const handleChatsUpdate = (chats: SupportChat[]) => {
      chats.forEach(chat => {
        const isAdmin = ["admin", "superadmin", "developer", "service"].includes(userData.role);
        const unreadCount = isAdmin ? chat.unreadByAdmin : chat.unreadByUser;
        const prevUnread = prevChatsRef.current[chat.id] || 0;

        if (unreadCount > prevUnread) {
          // New message detected!
          
          // Check user preferences (default to true if not set)
          const allowPush = userData.preferences?.pushNotifications !== false;
          
          if (!allowPush) {
            // Update ref and return early if notifications disabled
            prevChatsRef.current[chat.id] = unreadCount;
            return;
          }

          const sender = isAdmin ? chat.userName : "Support Team";
          const msg = `New message from ${sender}`;

          // 1. Browser Notification (System Tray)
          if (permission === "granted") {
            try {
               const n = new Notification("Smart Labs Support", {
                body: msg,
                icon: "/icons/icon-192x192.png",
                tag: `chat-${chat.id}`, // Replaces old notification for same chat
                silent: false
              });
              n.onclick = () => {
                window.focus();
                // Redirect to support page if admin, otherwise just focus
                if (isAdmin) {
                    router.push('/support');
                } else {
                    // For students, maybe go to dashboard or stay put
                    // router.push('/dashboard'); 
                }
              };
            } catch (e) {
              console.error("Notification failed", e);
            }
          }

          // 2. Audio Cue (Optional)
          // const audio = new Audio("/sounds/notification.mp3");
          // audio.play().catch(() => {});
        }

        prevChatsRef.current[chat.id] = unreadCount;
      });
    };

    if (["admin", "superadmin", "developer", "service"].includes(userData.role)) {
      unsubscribe = chatService.subscribeToAllChats(handleChatsUpdate);
    } else {
      unsubscribe = chatService.subscribeToUserChats(userData.uid, handleChatsUpdate);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userData, permission, router]);

  if (!userData || !showPermissionBanner || permission === "granted" || permission === "denied" || userData.preferences?.pushNotifications === false) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-white dark:bg-gray-800 shadow-xl rounded-xl p-4 border border-brand-blue/20 flex items-center gap-4 animate-in slide-in-from-top-4 max-w-sm w-full mx-4">
      <div className="p-2 bg-blue-100 text-brand-blue rounded-full">
        <Bell size={20} />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-sm text-gray-900 dark:text-white">Enable Notifications?</h4>
        <p className="text-xs text-gray-500">Get alerted when support replies to you.</p>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => setShowPermissionBanner(false)}
          className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
        >
          <X size={18} />
        </button>
        <button 
          onClick={requestPermission}
          className="px-3 py-1.5 bg-brand-blue text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Enable
        </button>
      </div>
    </div>
  );
}
