
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { auth } from "@/lib/firebase";
import { signOut, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, LogOut, Smile, Save, Award, Download, BookOpen, Clock, CheckCircle, ChevronDown, Trophy } from "lucide-react";
import { userService } from "@/services/userService";
import { MemojiSelector } from "@/components/features/MemojiSelector";
import { countries } from "@/data/countries";
import Link from "next/link";
import { courseService } from "@/services/courseService";
import { enrollmentService } from "@/services/enrollmentService";
import { Course, Enrollment } from "@/lib/types";

export default function ProfilePage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMemojiModalOpen, setIsMemojiModalOpen] = useState(false);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Record<string, Enrollment | null>>({});
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [badges, setBadges] = useState<Array<{ id: string; name: string; description: string; imageUrl: string }>>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);

  // Mock Certificates (In real app, fetch from collection)
  const certificates: { id: number; title: string; date: string; url: string }[] = [
    // { id: 1, title: "Advanced Web Development", date: "2024-12-15", url: "#" }
  ];

  const [formData, setFormData] = useState<{
    name: string;
    contact: string;
    country: string;
    gender: "male" | "female";
    bio?: string;
    websiteUrl?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    linkedinUrl?: string;
  }>({
    name: "",
    contact: "",
    country: "",
    gender: "male",
    bio: "",
    websiteUrl: "",
    facebookUrl: "",
    instagramUrl: "",
    linkedinUrl: ""
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        contact: userData.contact || "",
        country: userData.country || "",
        gender: (userData.gender as "male" | "female") || "male",
        bio: userData.bio || "",
        websiteUrl: (userData as any).websiteUrl || "",
        facebookUrl: (userData as any).facebookUrl || "",
        instagramUrl: (userData as any).instagramUrl || "",
        linkedinUrl: (userData as any).linkedinUrl || ""
      });
    }
  }, [userData]);

  useEffect(() => {
    const load = async () => {
      if (!userData?.uid) return;
      setCoursesLoading(true);
      try {
        const ids = userData.enrolledCourses || [];
        const courses = await Promise.all(ids.map(async (id) => await courseService.getCourse(id)));
        setMyCourses(courses.filter(Boolean) as Course[]);
        const stored = typeof window !== "undefined" ? localStorage.getItem("activeCourseId") : null;
        const initial = stored && ids.includes(stored) ? stored : (ids[0] || null);
        setActiveCourseId(initial);
        const enrolls = await enrollmentService.getUserEnrollments(userData.uid);
        const map: Record<string, Enrollment | null> = {};
        enrolls.forEach(e => { map[e.courseId] = e; });
        setMyEnrollments(map);
      } catch {
        setMyCourses([]);
        setMyEnrollments({});
      } finally {
        setCoursesLoading(false);
      }
    };
    load();
  }, [userData?.uid, userData?.enrolledCourses]);

  useEffect(() => {
    const loadBadges = async () => {
      if (!userData?.uid) return;
      setBadgesLoading(true);
      try {
        const mod = await import("@/services/badgeService");
        const bs = mod.badgeService;
        const list = await bs.getUserBadges(userData.uid);
        setBadges(list as any);
      } catch {
        setBadges([]);
      } finally {
        setBadgesLoading(false);
      }
    };
    loadBadges();
  }, [userData?.uid]);

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
          {myCourses.length >= 2 && (
            <div className="mt-4">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <BookOpen className="w-4 h-4 text-brand-blue" />
                <span className="text-xs text-gray-500">Active Course</span>
                <button
                  className="flex items-center gap-1 text-sm font-semibold text-gray-900"
                  onClick={() => {
                    const idx = Math.max(0, myCourses.findIndex(c => c.id === activeCourseId));
                    const next = myCourses[(idx + 1) % myCourses.length];
                    setActiveCourseId(next?.id || null);
                    if (next?.id && typeof window !== "undefined") {
                      localStorage.setItem("activeCourseId", next.id);
                    }
                    if (next?.id) {
                      router.push(`/courses/${next.id}`);
                    }
                  }}
                  title="Switch to next course"
                >
                  <span className="truncate max-w-[160px]">{myCourses.find(c => c.id === activeCourseId)?.title || "Select"}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          )}
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

      {/* Certificates Section */}
      <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-border">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Award className="text-brand-blue" />
          My Certificates
        </h2>
        
        {certificates.length > 0 ? (
          <div className="space-y-4">
            {certificates.map((cert) => (
              <div key={cert.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-brand-blue rounded-lg">
                    <Award size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{cert.title}</h3>
                    <p className="text-xs text-gray-500">Issued on {cert.date}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-brand-blue hover:bg-blue-50">
                  <Download size={16} className="mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-3">
              <Award size={24} />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">No certificates yet</p>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
              Complete courses and pass the final assessments to earn your certificates.
            </p>
          </div>
        )}
      </div>

      <MemojiSelector
        isOpen={isMemojiModalOpen}
        onClose={() => setIsMemojiModalOpen(false)}
        onSelect={handleMemojiSelect}
        currentImage={userData?.photoURL}
      />

      <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-border">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <BookOpen className="text-brand-blue" />
          My Courses
        </h2>
        {coursesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
          </div>
        ) : myCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myCourses.map((course) => {
              const en = myEnrollments[course.id];
              const progress = en?.progress || 0;
              const isActive = en?.status === "active";
              return (
                <Link key={course.id} href={`/courses/${course.id}`} className="group">
                  <div className="rounded-2xl p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 overflow-hidden">
                        {course.image ? (
                          <Image src={course.image} alt={course.title} width={128} height={128} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <BookOpen className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-brand-blue">
                            {course.title}
                          </h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isActive ? "text-emerald-700 border-emerald-200 bg-emerald-50" : "text-gray-600 border-gray-200 bg-gray-50"}`}>
                            {isActive ? "Active" : (en?.status || "Pending")}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                          {course.description}
                        </p>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-blue transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>Flexible</span>
                          </div>
                          {course.includesCertificate && (
                            <div className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle size={12} />
                              <span>Certificate</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-3">
              <BookOpen size={24} />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">No enrolled courses</p>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
              Browse the catalog and enroll to start learning.
            </p>
            <div className="mt-4">
              <Link href="/courses">
                <Button size="sm">Browse Courses</Button>
              </Link>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell others about your learning goals, experience, and interests."
                className="mt-1 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent dark:border-gray-700 dark:text-white"
                rows={4}
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Website"
                value={formData.websiteUrl || ""}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://example.com"
                className="text-xs md:text-sm"
              />
              <Input
                label="LinkedIn"
                value={formData.linkedinUrl || ""}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="text-xs md:text-sm"
              />
              <Input
                label="Facebook"
                value={formData.facebookUrl || ""}
                onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                placeholder="https://facebook.com/username"
                className="text-xs md:text-sm"
              />
              <Input
                label="Instagram"
                value={formData.instagramUrl || ""}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                placeholder="https://instagram.com/username"
                className="text-xs md:text-sm"
              />
            </div>
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-border">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Trophy className="text-amber-500" />
          Achievements
        </h2>
        {badgesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
          </div>
        ) : badges.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {badges.map((b) => (
              <div key={b.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 overflow-hidden flex items-center justify-center">
                  {b.imageUrl ? (
                    <Image src={b.imageUrl} alt={b.name} width={48} height={48} className="object-cover" />
                  ) : (
                    <Award className="w-6 h-6 text-amber-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{b.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{b.description}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-3">
              <Trophy size={24} />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">No achievements yet</p>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
              Complete activities and courses to earn badges and achievements.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
