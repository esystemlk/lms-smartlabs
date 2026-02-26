"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/userService";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { CheckCircle, ArrowRight, BookOpen, CreditCard, Calendar } from "lucide-react";
import { useState } from "react";

export default function OnboardingPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const completeOnboarding = async () => {
    if (!user?.uid) {
      router.push("/login");
      return;
    }
    setSaving(true);
    try {
      await userService.updateProfile(user.uid, { onboardingCompleted: true });
      router.push("/courses");
    } catch (e) {
      console.error(e);
      router.push("/courses");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome to SMART LABS</h1>
            <p className="text-gray-600 mt-1">A quick guide on how to enroll in your first course</p>
          </div>
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">1. Choose Your Course</h3>
            <p className="text-sm text-gray-600">Browse the catalog and open a course to see details.</p>
          </div>
          <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">2. Pick Batch & Time Slot</h3>
            <p className="text-sm text-gray-600">Select your preferred batch and time slot for classes.</p>
          </div>
          <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center mb-3">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">3. Complete Payment</h3>
            <p className="text-sm text-gray-600">Pay securely via PayHere or upload bank transfer proof.</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative rounded-2xl overflow-hidden border border-gray-200">
            <Image
              src="/onboarding/courses-hero.png"
              alt="Courses overview"
              width={1024}
              height={1024}
              className="object-cover"
              priority
            />
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">Tips</h2>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>Use your real name; it appears on certificates.</li>
              <li>Choose a time slot you can consistently attend.</li>
              <li>After payment, access materials from your dashboard.</li>
            </ul>
            <div className="pt-4">
              <Button onClick={completeOnboarding} className="inline-flex items-center gap-2">
                {saving ? "Loading..." : "Start Browsing Courses"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
