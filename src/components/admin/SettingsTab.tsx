"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Save, AlertTriangle, Globe, Lock, Bell } from "lucide-react";

export function SettingsTab() {
  const [siteName, setSiteName] = useState("SMART LABS");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      alert("Settings saved successfully!");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Globe size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">General Settings</h3>
        </div>
        
        <div className="space-y-4 max-w-xl">
          <Input 
            label="Site Name" 
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
          />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Support Email</label>
            <input 
              type="email" 
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
              defaultValue="support@smartlabs.com"
            />
          </div>
        </div>
      </div>

      {/* Announcement Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
            <Bell size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Global Announcement</h3>
        </div>
        
        <div className="space-y-4 max-w-xl">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Banner Message</label>
            <textarea 
              rows={3}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
              placeholder="Enter a message to display at the top of all pages..."
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
            />
            <p className="text-xs text-gray-500">Leave empty to hide the banner.</p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 text-red-600 rounded-lg">
            <Lock size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">System Control</h3>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className={maintenanceMode ? "text-red-500" : "text-gray-400"} />
            <div>
              <p className="font-medium text-gray-900">Maintenance Mode</p>
              <p className="text-sm text-gray-500">Disable access for all non-admin users</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          <Save size={18} />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
