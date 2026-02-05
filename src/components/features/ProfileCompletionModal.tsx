"use client";

import { useState, useEffect } from "react";
import { UserData } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { userService } from "@/services/userService";
import { Loader2, Save, UserCheck, AlertCircle } from "lucide-react";
import { countries } from "@/data/countries";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";

interface ProfileCompletionModalProps {
  user: UserData;
}

export function ProfileCompletionModal({ user }: ProfileCompletionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { userData } = useAuth(); // Get latest data
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    country: "",
    gender: "male" as "male" | "female",
    bio: ""
  });

  // Check if profile is incomplete
  useEffect(() => {
    if (!user) return;

    // Define required fields
    const isProfileIncomplete = 
      !user.name || 
      !user.contact || 
      !user.country || 
      !user.gender;

    if (isProfileIncomplete) {
      setFormData({
        name: user.name || "",
        contact: user.contact || "",
        country: user.country || "",
        gender: (user.gender as "male" | "female") || "male",
        bio: user.bio || ""
      });
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [user, userData]); // Re-run when user data changes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!formData.name || !formData.contact || !formData.country) {
      toast("Please fill in all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      await userService.updateProfile(user.uid, formData);
      toast("Profile updated successfully!", "success");
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast("Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="bg-brand-blue/10 dark:bg-brand-blue/20 p-6 text-center border-b border-brand-blue/10">
          <div className="w-16 h-16 bg-brand-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <UserCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Your Profile</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">
            Please verify and complete your details to continue accessing the platform.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              Your contact and location details are required for course enrollments and certificate issuance.
            </p>
          </div>

          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
            className="bg-white dark:bg-gray-800"
          />

          <Input
            label="Contact Number"
            value={formData.contact}
            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            placeholder="+94 77 123 4567"
            required
            className="bg-white dark:bg-gray-800"
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white transition-all"
              required
            >
              <option value="" disabled>Select your country</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
            <div className="flex gap-6 mt-2 p-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${formData.gender === 'male' ? 'border-brand-blue bg-brand-blue' : 'border-gray-300 dark:border-gray-600'}`}>
                  {formData.gender === 'male' && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === "male"}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as "male" | "female" })}
                  className="hidden"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-brand-blue transition-colors">Male</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${formData.gender === 'female' ? 'border-brand-blue bg-brand-blue' : 'border-gray-300 dark:border-gray-600'}`}>
                  {formData.gender === 'female' && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === "female"}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as "male" | "female" })}
                  className="hidden"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-brand-blue transition-colors">Female</span>
              </label>
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <Button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="w-full h-12 text-base shadow-lg shadow-blue-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving Profile...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save & Continue
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
