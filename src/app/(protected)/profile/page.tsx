
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/firebase";
import { signOut, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, LogOut, Smile } from "lucide-react";
import { userService } from "@/services/userService";
import { MemojiSelector } from "@/components/features/MemojiSelector";

export default function ProfilePage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [isMemojiModalOpen, setIsMemojiModalOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !userData) return;

    const file = e.target.files[0];
    setUploading(true);
    try {
      await userService.uploadProfileImage(userData.uid, file);
      // The context will automatically update due to the onSnapshot listener in AuthContext
    } catch (error) {
      console.error("Error uploading profile image:", error);
      alert("Failed to upload profile image");
    } finally {
      setUploading(false);
    }
  };

  const handleMemojiSelect = async (url: string) => {
    if (!userData) return;
    setUploading(true);
    try {
      await userService.updateProfile(userData.uid, { photoURL: url });
      // Also update Auth profile for consistency
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: url });
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      alert("Failed to update avatar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
      
      <div className="bg-white dark:bg-card rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-border space-y-8">
        
        {/* Profile Header */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative group cursor-pointer">
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-700 shadow-md relative overflow-hidden">
              {userData?.photoURL ? (
                <Image 
                  src={userData.photoURL} 
                  alt={userData.name} 
                  fill 
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold text-3xl">
                  {userData?.name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              
              {/* Upload Overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </div>
            </div>

            {/* Hidden File Input */}
            <input 
              type="file" 
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </div>

          <button 
            onClick={() => setIsMemojiModalOpen(true)}
            className="mt-4 text-sm text-brand-blue hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <Smile size={16} />
            Or create an avatar
          </button>
          
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
            {userData?.name || "User Name"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">{userData?.email}</p>
          <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {userData?.role || "Student"}
          </span>
        </div>
        
        {/* Account Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100 dark:border-border">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Contact Number</label>
            <p className="mt-1 text-gray-900 dark:text-white">{userData?.contact || "Not set"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Country</label>
            <p className="mt-1 text-gray-900 dark:text-white">{userData?.country || "Not set"}</p>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Gender</label>
             <p className="mt-1 text-gray-900 dark:text-white capitalize">{userData?.gender || "Not set"}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 border-t border-gray-100 dark:border-border flex justify-end">
          <Button 
            variant="outline" 
            onClick={handleLogout} 
            className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <MemojiSelector 
        isOpen={isMemojiModalOpen}
        onClose={() => setIsMemojiModalOpen(false)}
        onSelect={handleMemojiSelect}
        currentImage={userData?.photoURL}
      />
    </div>
  );
}
