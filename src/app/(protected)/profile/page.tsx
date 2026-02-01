
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { auth } from "@/lib/firebase";
import { signOut, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, LogOut, Smile, Save } from "lucide-react";
import { userService } from "@/services/userService";
import { MemojiSelector } from "@/components/features/MemojiSelector";
import { countries } from "@/data/countries";

export default function ProfilePage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMemojiModalOpen, setIsMemojiModalOpen] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    contact: string;
    country: string;
    gender: "male" | "female";
  }>({
    name: "",
    contact: "",
    country: "",
    gender: "male"
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        contact: userData.contact || "",
        country: userData.country || "",
        gender: (userData.gender as "male" | "female") || "male"
      });
    }
  }, [userData]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    setSaving(true);
    try {
      await userService.updateProfile(userData.uid, formData);

      if (auth.currentUser && formData.name !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: formData.name });
      }

      // Optional: Show success toast/message
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto px-4 pb-28 md:pb-8">
      <h1 className="text-lg md:text-2xl font-bold text-gray-900">Profile Settings</h1>

      <div className="bg-white dark:bg-card rounded-2xl p-3 md:p-8 shadow-sm border border-gray-100 dark:border-border space-y-4 md:space-y-8">

        {/* Profile Header */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative group cursor-pointer">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-700 shadow-md relative overflow-hidden">
              {userData?.photoURL ? (
                <Image
                  src={userData.photoURL}
                  alt={userData.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold text-xl md:text-3xl">
                  {userData?.name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}

              {/* Upload Overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 md:w-6 md:h-6 text-white" />
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
            className="mt-2 md:mt-4 text-xs md:text-sm text-brand-blue hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <Smile size={14} className="md:w-4 md:h-4" />
            Or create an avatar
          </button>

          <h2 className="mt-2 md:mt-4 text-base md:text-xl font-bold text-gray-900 dark:text-white">
            {userData?.name || "User Name"}
          </h2>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{userData?.email}</p>
          <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {userData?.role || "Student"}
          </span>
        </div>

        {/* Account Details Form */}
        <form onSubmit={handleSave} className="space-y-3 md:space-y-6 pt-4 md:pt-6 border-t border-gray-100 dark:border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
            <div className="md:col-span-2">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="text-xs md:text-sm"
              />
            </div>

            <div>
              <Input
                label="Contact Number"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="+94 77 123 4567"
                className="text-xs md:text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="flex h-9 md:h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-xs md:text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-white"
              >
                <option value="" disabled>Select your country</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === "male"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as "male" | "female" })}
                    className="text-brand-blue focus:ring-brand-blue w-3 h-3 md:w-4 md:h-4"
                  />
                  <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300">Male</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === "female"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as "male" | "female" })}
                    className="text-brand-blue focus:ring-brand-blue w-3 h-3 md:w-4 md:h-4"
                  />
                  <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300">Female</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 text-xs md:text-sm h-8 md:h-10"
            >
              <LogOut className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              Sign Out
            </Button>

            <Button type="submit" disabled={saving} className="text-xs md:text-sm h-8 md:h-10">
              {saving ? (
                <>
                  <Loader2 className="w-3 h-3 md:w-4 md:h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
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
