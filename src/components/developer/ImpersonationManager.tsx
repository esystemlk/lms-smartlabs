"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { UserRole } from "@/lib/types";
import { User, Shield, GraduationCap, Users, UserCog, Settings } from "lucide-react";

export function ImpersonationManager() {
  const { impersonateRole, userData } = useAuth();

  const roles: { id: UserRole; label: string; icon: any; description: string }[] = [
    { id: "student", label: "Student", icon: GraduationCap, description: "View the platform as a standard student." },
    { id: "lecturer", label: "Lecturer", icon: Users, description: "Access lecturer tools and course management." },
    { id: "admin", label: "Admin", icon: Shield, description: "Access administrative dashboards." },
    { id: "instructor", label: "Instructor", icon: UserCog, description: "Manage courses and students." },
  ];

  const handleImpersonate = (role: UserRole) => {
    if (confirm(`Are you sure you want to switch your view to '${role}'? You can exit this mode from the top banner.`)) {
      impersonateRole(role);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <UserCog className="w-5 h-5 text-purple-600" />
          Role Impersonation
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Temporarily switch your permissions to view the platform as a different user role. 
          Useful for debugging access controls and UI layouts.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleImpersonate(role.id)}
              className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-purple-200 hover:bg-purple-50 transition-all text-left group"
            >
              <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                <role.icon className="w-6 h-6 text-gray-500 group-hover:text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 group-hover:text-purple-700">
                  {role.label}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {role.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl flex items-start gap-3">
          <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
             <Settings className="w-4 h-4" />
          </div>
          <div className="text-sm text-yellow-800">
            <p className="font-semibold">Note:</p>
            <p>
              Impersonation only affects your local session. It does not change your actual database role. 
              Use the banner at the top of the screen to exit impersonation mode.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
