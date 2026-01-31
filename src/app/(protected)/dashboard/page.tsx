"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
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
  GraduationCap
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <GreetingWidget />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <button
            key={item.title}
            onClick={() => router.push(item.href)}
            className="group flex flex-col items-start p-6 bg-white rounded-2xl shadow-soft hover:shadow-xl transition-all duration-300 border border-transparent hover:border-brand-blue/10 text-left h-full"
          >
            <div className={clsx("p-3 rounded-xl text-white mb-4 transition-transform group-hover:scale-110", item.color)}>
              <item.icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-brand-blue transition-colors">
              {item.title}
            </h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
              {item.description}
            </p>
            <div className="mt-auto flex items-center text-sm font-medium text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 transition-transform">
              Open <ArrowRight size={16} className="ml-1" />
            </div>
          </button>
        ))}
      </div>


    </div>
  );
}