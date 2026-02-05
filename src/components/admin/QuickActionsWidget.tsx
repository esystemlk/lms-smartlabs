"use client";

import { useRouter } from "next/navigation";
import { PlusCircle, UserPlus, Megaphone, Settings, FileText, BarChart } from "lucide-react";

export function QuickActionsWidget() {
  const router = useRouter();

  const actions = [
    {
      label: "New Course",
      icon: PlusCircle,
      color: "text-emerald-600 bg-emerald-50",
      onClick: () => router.push("/admin/courses/new"),
      desc: "Create a new learning path"
    },
    {
      label: "Enroll Student",
      icon: UserPlus,
      color: "text-blue-600 bg-blue-50",
      onClick: () => router.push("/admin/enrollments/new"),
      desc: "Add user to a batch"
    },
    {
      label: "Announcements",
      icon: Megaphone,
      color: "text-orange-600 bg-orange-50",
      onClick: () => router.push("/admin/communication"),
      desc: "Broadcast message"
    },
    {
      label: "System Status",
      icon: BarChart,
      color: "text-purple-600 bg-purple-50",
      onClick: () => router.push("/admin/analytics"),
      desc: "Check health & stats"
    }
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-gray-500" />
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="flex flex-col items-start p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left group"
          >
            <div className={`p-2 rounded-lg mb-3 ${action.color} group-hover:scale-110 transition-transform`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">{action.label}</span>
            <span className="text-xs text-gray-500 mt-1">{action.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
