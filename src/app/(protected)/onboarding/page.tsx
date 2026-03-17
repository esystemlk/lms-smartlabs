"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/userService";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { CheckCircle, ArrowRight, BookOpen, CreditCard, Calendar, Loader2 } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 md:py-16 px-4 pb-24 md:pb-16">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 border border-gray-100 dark:border-gray-800 shadow-xl shadow-blue-500/5 relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-brand-blue/5 rounded-full blur-3xl -mr-16 -mt-16" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 md:mb-16">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                Welcome to <br className="hidden md:block" />
                <span className="text-brand-blue">SMART LABS</span>
              </h1>
              <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 font-medium">Your journey to English mastery starts here.</p>
            </div>
            <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 shadow-inner">
              <CheckCircle className="w-8 h-8 md:w-10 md:h-10" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-8">
            <div className="group p-6 rounded-3xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/30 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">1. Choose Course</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Browse our expert-led catalog and find the perfect program for your goals.</p>
            </div>
            
            <div className="group p-6 rounded-3xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">2. Pick Schedule</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Select a batch and time slot that fits your lifestyle perfectly.</p>
            </div>

            <div className="group p-6 rounded-3xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">3. Join Now</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Complete your enrollment with secure payment and start learning instantly.</p>
            </div>
          </div>

          <div className="mt-10 md:mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="relative aspect-video md:aspect-square rounded-[2rem] overflow-hidden border-4 border-white dark:border-gray-800 shadow-2xl">
              <Image
                src="/onboarding/courses-hero.png"
                alt="Courses overview"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Success Tips</h2>
                <div className="space-y-4">
                  {[
                    "Use your real name for official certificates",
                    "Choose a consistent time slot for best results",
                    "Materials are instantly unlocked after payment"
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="mt-1 w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-brand-blue" />
                      </div>
                      <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 md:pt-6">
                <Button 
                  onClick={completeOnboarding} 
                  className="w-full md:w-auto px-8 py-6 h-auto text-lg rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                >
                  {saving ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <>
                      Explore Courses
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 font-medium">
          © 2024 SMART LABS. Empowering students through language.
        </p>
      </div>
    </div>
  );
}
