"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { countries } from "@/data/countries";
import { 
  User, 
  Lock, 
  Bell, 
  Palette,
  Loader2,
  Check,
  AlertCircle,
  Moon,
  Sun,
  Shield,
  Smartphone
} from "lucide-react";
import { clsx } from "clsx";

export default function SettingsPage() {
  const { userData, user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // General Settings State
  const [profileData, setProfileData] = useState({
    name: "",
    contact: "",
    country: "",
    gender: "male",
    bio: ""
  });

  // Security Settings State
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Preferences State
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    darkMode: false,
    compactMode: false
  });

  // Load initial data
  useEffect(() => {
    if (userData) {
      setProfileData({
        name: userData.name || "",
        contact: userData.contact || "",
        country: userData.country || "",
        gender: userData.gender || "male",
        bio: userData.bio || ""
      });
    }
  }, [userData]);

  // Load preferences separately as they might be in a sub-collection or field
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.uid) return;
      try {
        // Checking if preferences are stored in the main doc or separate
        // For now assuming they are in the main doc under 'preferences' field
        if (userData?.preferences) {
          setPreferences(prev => ({ ...prev, ...userData.preferences }));
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    };
    loadPreferences();
  }, [user, userData]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: profileData.name,
        contact: profileData.contact,
        country: profileData.country,
        gender: profileData.gender,
        bio: profileData.bio,
        updatedAt: new Date()
      });
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    
    if (securityData.newPassword !== securityData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    if (securityData.newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, securityData.currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, securityData.newPassword);
      
      setMessage({ type: "success", text: "Password updated successfully!" });
      setSecurityData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/wrong-password') {
        setMessage({ type: "error", text: "Incorrect current password." });
      } else {
        setMessage({ type: "error", text: "Failed to update password. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceUpdate = async (key: string, value: boolean) => {
    if (!user?.uid) return;
    
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences); // Optimistic update

    try {
      await updateDoc(doc(db, "users", user.uid), {
        preferences: newPreferences
      });
    } catch (error) {
      console.error("Failed to save preference:", error);
      // Revert on failure
      setPreferences(preferences);
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMessage({ type: "", text: "" });
                  }}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap",
                    isActive 
                      ? "bg-brand-blue text-white shadow-md shadow-blue-200 dark:shadow-blue-900/20" 
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 bg-card"
                  )}
                >
                  <Icon size={18} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* General Settings */}
          {activeTab === "general" && (
            <div className="bg-card rounded-2xl p-6 shadow-soft space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Personal Information</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update your personal details here.</p>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Full Name"
                    value={profileData.name} 
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  />
                  <Input 
                    label="Contact Number"
                    value={profileData.contact} 
                    onChange={(e) => setProfileData({...profileData, contact: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                  <textarea 
                    className="w-full px-4 py-2 rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all resize-none h-24 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Tell us a little about yourself..."
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                    <select
                      value={profileData.country}
                      onChange={(e) => setProfileData({...profileData, country: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                    >
                      <option value="">Select a country</option>
                      {countries.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                    <div className="flex items-center gap-4 h-[42px]">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={profileData.gender === "male"}
                          onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                          className="w-4 h-4 text-brand-blue focus:ring-brand-blue"
                        />
                        <span className="text-gray-700 dark:text-gray-300">Male</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={profileData.gender === "female"}
                          onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                          className="w-4 h-4 text-brand-blue focus:ring-brand-blue"
                        />
                        <span className="text-gray-700 dark:text-gray-300">Female</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className="bg-card rounded-2xl p-6 shadow-soft space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Security</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your password and account security.</p>
              </div>

              <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                <Input 
                  label="Current Password"
                  type="password"
                  value={securityData.currentPassword}
                  onChange={(e) => setSecurityData({...securityData, currentPassword: e.target.value})}
                  required
                />
                <Input 
                  label="New Password"
                  type="password"
                  value={securityData.newPassword}
                  onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
                  required
                />
                <Input 
                  label="Confirm New Password"
                  type="password"
                  value={securityData.confirmPassword}
                  onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                  required
                />

                <div className="pt-4">
                  <Button type="submit" disabled={loading} variant="outline" className="w-full">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === "notifications" && (
            <div className="bg-card rounded-2xl p-6 shadow-soft space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Notifications</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose what you want to be notified about.</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <h3 className="font-medium text-foreground">Email Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates and alerts via email.</p>
                  </div>
                  <button 
                    onClick={() => handlePreferenceUpdate('emailNotifications', !preferences.emailNotifications)}
                    className={clsx(
                      "w-12 h-6 rounded-full transition-colors relative",
                      preferences.emailNotifications ? "bg-brand-blue" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <div className={clsx(
                      "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                      preferences.emailNotifications ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <h3 className="font-medium text-foreground">Push Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications on your device.</p>
                  </div>
                  <button 
                    onClick={async () => {
                      const newValue = !preferences.pushNotifications;
                      if (newValue && "Notification" in window) {
                        if (Notification.permission === "default") {
                          await Notification.requestPermission();
                        } else if (Notification.permission === "denied") {
                          alert("Please enable notifications in your browser settings to receive alerts.");
                          return;
                        }
                      }
                      handlePreferenceUpdate('pushNotifications', newValue);
                    }}
                    className={clsx(
                      "w-12 h-6 rounded-full transition-colors relative",
                      preferences.pushNotifications ? "bg-brand-blue" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <div className={clsx(
                      "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                      preferences.pushNotifications ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Marketing Emails</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive news about new features and updates.</p>
                  </div>
                  <button 
                    onClick={() => handlePreferenceUpdate('marketingEmails', !preferences.marketingEmails)}
                    className={clsx(
                      "w-12 h-6 rounded-full transition-colors relative",
                      preferences.marketingEmails ? "bg-brand-blue" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <div className={clsx(
                      "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                      preferences.marketingEmails ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === "appearance" && (
            <div className="bg-card rounded-2xl p-6 shadow-soft space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Appearance</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Customize how the application looks.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => handlePreferenceUpdate('darkMode', false)}
                  className={clsx(
                    "p-4 rounded-xl border-2 flex items-center gap-4 transition-all",
                    !preferences.darkMode 
                      ? "border-brand-blue bg-blue-50/50 dark:bg-blue-900/20" 
                      : "border-border hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-orange-500">
                    <Sun size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-foreground">Light Mode</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Default bright appearance</p>
                  </div>
                  {!preferences.darkMode && <Check className="ml-auto text-brand-blue" size={20} />}
                </button>

                <button 
                  onClick={() => handlePreferenceUpdate('darkMode', true)}
                  className={clsx(
                    "p-4 rounded-xl border-2 flex items-center gap-4 transition-all",
                    preferences.darkMode 
                      ? "border-brand-blue bg-blue-50/50 dark:bg-blue-900/20" 
                      : "border-border hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-900 shadow-sm flex items-center justify-center text-blue-400">
                    <Moon size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-foreground">Dark Mode</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Easy on the eyes</p>
                  </div>
                  {preferences.darkMode && <Check className="ml-auto text-brand-blue" size={20} />}
                </button>
              </div>

              <div className="pt-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Compact Mode</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Reduce whitespace for higher information density.</p>
                  </div>
                  <button 
                    onClick={() => handlePreferenceUpdate('compactMode', !preferences.compactMode)}
                    className={clsx(
                      "w-12 h-6 rounded-full transition-colors relative",
                      preferences.compactMode ? "bg-brand-blue" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <div className={clsx(
                      "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                      preferences.compactMode ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Messages */}
          {message.text && (
            <div className={clsx(
              "mt-4 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom-2",
              message.type === "success" ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
            )}>
              {message.type === "success" ? <Check size={20} /> : <AlertCircle size={20} />}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}