"use client";

import { AttendanceTab } from "@/components/admin/AttendanceTab";
import { ChevronLeft, CalendarCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AttendancePage() {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 pt-4 px-4 md:px-0">
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ChevronLeft size={24} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-brand-blue" />
            Attendance Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manually mark or update attendance for classes
          </p>
        </div>
      </div>

      <AttendanceTab />
    </div>
  );
}
