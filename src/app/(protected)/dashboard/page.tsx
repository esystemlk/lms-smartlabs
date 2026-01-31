"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { 
  BookOpen, 
  Globe, 
  ShieldCheck, 
  Users, 
  Edit, 
  Activity, 
  BarChart2, 
  Settings,
  ArrowRight,
  ExternalLink,
  GraduationCap,
  AlertTriangle
} from "lucide-react";
import { clsx } from "clsx";
import { GreetingWidget } from "@/components/features/GreetingWidget";

export default function DashboardPage() {
  const { userData } = useAuth();
  const router = useRouter();

  const menuItems = [
    {
      title: "LMS",
      description: "Central hub for classes, assignments, and resources.",
      icon: GraduationCap,
      href: "/lms",
      color: "bg-teal-500",
      roles: ["student", "lecturer", "admin", "superadmin", "developer"]
    },
    {
      title: "COURSES",
      description: "Access your enrolled courses and learning materials.",
      icon: BookOpen,
      href: "/courses",
      color: "bg-blue-500",
      roles: ["student", "lecturer", "admin", "superadmin", "developer"]
    },
    {
      title: "OUR WEBSITES",
      description: "Explore our network of educational websites.",
      icon: Globe,
      href: "/websites", // Placeholder
      color: "bg-indigo-500",
      roles: ["student", "lecturer", "admin", "superadmin", "developer"]
    },
    {
      title: "LMS ADMINISTRATOR",
      description: "Manage users, roles, and system configurations.",
      icon: ShieldCheck,
      href: "/admin",
      color: "bg-red-500",
      roles: ["admin", "superadmin", "developer"]
    },
    {
      title: "LECTURERS",
      description: "View lecturer profiles and schedules.",
      icon: Users,
      href: "/lecturers", // Placeholder
      color: "bg-emerald-500",
      roles: ["student", "lecturer", "admin", "superadmin", "developer"]
    },
    {
      title: "COURSE MANAGEMENT",
      description: "Create and edit course content.",
      icon: Edit,
      href: "/courses/manage", // Placeholder
      color: "bg-orange-500",
      roles: ["lecturer", "admin", "superadmin", "developer"]
    },
    {
      title: "ACTIVITIES",
      description: "Quizzes, assignments, and interactive tasks.",
      icon: Activity,
      href: "/activities", // Placeholder
      color: "bg-pink-500",
      roles: ["student", "lecturer", "admin", "superadmin", "developer"]
    },
    {
      title: "SYSTEM DETAILS",
      description: "Monitor website status and visitor analytics.",
      icon: BarChart2,
      href: "/system-status", // Placeholder
      color: "bg-cyan-500",
      roles: ["admin", "superadmin", "developer"]
    },
    {
      title: "SETTINGS",
      description: "Profile, theme, notifications, and password.",
      icon: Settings,
      href: "/settings",
      color: "bg-gray-500",
      roles: ["student", "lecturer", "admin", "superadmin", "developer"]
    }
  ];

  // Filter items based on user role
  const filteredItems = menuItems.filter(item => 
    userData?.role && item.roles.includes(userData.role)
  );

  // Check for missing profile details
  const requiredFields = ["name", "email", "contact", "country", "gender"];
  const missingFields = userData 
    ? requiredFields.filter(field => !userData[field as keyof typeof userData])
    : [];
  
  const showProfileWarning = !userData || missingFields.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <GreetingWidget />

      {showProfileWarning && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-amber-800">Complete Your Profile</h3>
              <p className="text-sm text-amber-700 mt-1">
                Your profile is missing some details ({missingFields.join(", ") || "details"}). 
                Please complete it to access all features.
              </p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-white border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 shrink-0"
            onClick={() => router.push("/profile")}
          >
            Update Profile
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
        {filteredItems.map((item) => (
          <button
            key={item.title}
            onClick={() => router.push(item.href)}
            className="group flex flex-col items-start p-4 md:p-6 bg-white rounded-2xl shadow-soft hover:shadow-xl transition-all duration-300 border border-transparent hover:border-brand-blue/10 text-left h-full"
          >
            <div className={clsx("p-2.5 md:p-3 rounded-xl text-white mb-3 md:mb-4 transition-transform group-hover:scale-110", item.color)}>
              <item.icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-1.5 md:mb-2 group-hover:text-brand-blue transition-colors line-clamp-1">
              {item.title}
            </h3>
            <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4 line-clamp-2">
              {item.description}
            </p>
            <div className="mt-auto flex items-center text-xs md:text-sm font-medium text-brand-blue opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-0 md:translate-x-[-10px] md:group-hover:translate-x-0 transition-transform">
              Open <ArrowRight size={14} className="ml-1 md:w-4 md:h-4" />
            </div>
          </button>
        ))}
      </div>


    </div>
  );
}