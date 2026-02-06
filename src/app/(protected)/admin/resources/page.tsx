"use client";

import { ResourceManager } from "@/components/admin/ResourceManager";
import { FolderOpen } from "lucide-react";

export default function AdminResourcesPage() {
  return (
    <div className="max-w-7xl mx-auto pb-20 pt-4 px-4 md:px-0">
        <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-brand-blue/10 rounded-xl text-brand-blue">
                <FolderOpen size={24} />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Resource Manager</h1>
                <p className="text-sm text-gray-500">Manage course study materials and folders</p>
            </div>
        </div>

        <ResourceManager />
    </div>
  );
}
