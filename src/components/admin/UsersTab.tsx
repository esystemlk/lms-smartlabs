"use client";

import { useState } from "react";
import { UserData, UserRole } from "@/lib/types";
import { Search, Filter, Shield, MoreVertical, Check, X, UserPlus } from "lucide-react";
import { userService } from "@/services/userService";
import { Button } from "@/components/ui/Button";
import { AddUserModal } from "./AddUserModal";

interface UsersTabProps {
  users: UserData[];
  onUserUpdated: () => void;
}

export function UsersTab({ users, onUserUpdated }: UsersTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [updating, setUpdating] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleEditClick = (user: UserData) => {
    setEditingId(user.uid);
    setSelectedRole(user.role);
  };

  const handleSaveRole = async (userId: string) => {
    try {
      setUpdating(true);
      await userService.updateUserRole(userId, selectedRole);
      setEditingId(null);
      onUserUpdated();
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("Failed to update role. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-700";
      case "superadmin": return "bg-purple-100 text-purple-700";
      case "lecturer": return "bg-blue-100 text-blue-700";
      case "developer": return "bg-emerald-100 text-emerald-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header / Controls */}
      <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">User Management</h2>
        
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full md:w-auto items-center">
          <div className="flex gap-3 md:gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 md:pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-9 md:pl-10 pr-8 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all appearance-none bg-white"
              >
                <option value="all">All Roles</option>
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
                <option value="admin">Admin</option>
                <option value="service">Service</option>
                <option value="developer">Developer</option>
              </select>
            </div>
          </div>

          <Button onClick={() => setShowAddUserModal(true)} className="w-full md:w-auto text-sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 md:px-6 md:py-4">User</th>
              <th className="px-4 py-3 md:px-6 md:py-4">Role</th>
              <th className="hidden md:table-cell px-4 py-3 md:px-6 md:py-4">Contact</th>
              <th className="hidden md:table-cell px-4 py-3 md:px-6 md:py-4">Country</th>
              <th className="px-4 py-3 md:px-6 md:py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 md:px-6 md:py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center font-bold text-gray-500 overflow-hidden">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs md:text-base">{user.name?.charAt(0).toUpperCase() || "U"}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm md:text-base">{user.name}</div>
                      <div className="text-xs md:text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 md:px-6 md:py-4">
                  {editingId === user.uid ? (
                    <select 
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                      className="text-xs md:text-sm rounded-lg border border-gray-300 p-1"
                      disabled={updating}
                    >
                      <option value="student">Student</option>
                      <option value="lecturer">Lecturer</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                      <option value="service">Service</option>
                      <option value="developer">Developer</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-[10px] md:text-xs font-medium capitalize ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="hidden md:table-cell px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm text-gray-500">
                  {user.contact || "-"}
                </td>
                <td className="hidden md:table-cell px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm text-gray-500">
                  {user.country || "-"}
                </td>
                <td className="px-4 py-3 md:px-6 md:py-4 text-right">
                  {editingId === user.uid ? (
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleSaveRole(user.uid)}
                        disabled={updating}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        disabled={updating}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleEditClick(user)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit Role"
                    >
                      <Shield size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          No users found matching your search.
        </div>
      )}

      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onSuccess={() => {
            setShowAddUserModal(false);
            onUserUpdated();
            alert("User created successfully!");
          }}
          defaultRole="lecturer" // Default to lecturer as per request
        />
      )}
    </div>
  );
}
