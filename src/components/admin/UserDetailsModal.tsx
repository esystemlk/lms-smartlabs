"use client";

import { UserData } from "@/lib/types";
import { X, Mail, Phone, MapPin, Calendar, Shield } from "lucide-react";
import { UserAttendanceHistory } from "./UserAttendanceHistory";
import { format } from "date-fns";

interface UserDetailsModalProps {
  user: UserData;
  onClose: () => void;
}

export function UserDetailsModal({ user, onClose }: UserDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Student Details</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* User Profile Info */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`}>
                    {user.role}
                  </span>
                  <span className="text-xs text-gray-400">
                    Joined {user.createdAt?.seconds ? format(new Date(user.createdAt.seconds * 1000), "MMM d, yyyy") : "Unknown"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  {user.email}
                </div>
                {user.contact && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    {user.contact}
                  </div>
                )}
                {user.country && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    {user.country}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Attendance History</h3>
            <UserAttendanceHistory userId={user.uid} />
          </div>

        </div>
      </div>
    </div>
  );
}
