"use client";

import { useState, useEffect } from "react";
import { settingsService } from "@/services/settingsService";
import { SystemSettings } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  Save, 
  RefreshCw, 
  Trash2, 
  AlertTriangle, 
  Terminal, 
  Smartphone, 
  Globe, 
  Monitor,
  Flag,
  RotateCcw,
  HardDrive
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { useTheme } from "@/context/ThemeContext";

export function AdvancedSettingsManager() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Client State Managers
  const { setCurrency } = useCurrency();
  const { setTheme } = useTheme();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error(err);
      setLocalError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setLocalError("");
    setSuccessMsg("");
    try {
      await settingsService.updateSettings(settings);
      setSuccessMsg("Settings updated successfully");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setLocalError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const clearLocalStorage = () => {
    if (confirm("Are you sure? This will clear all local preferences and log you out.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const resetTheme = () => {
    setTheme("system");
    alert("Theme reset to System Default");
  };

  const resetCurrency = () => {
    setCurrency("LKR");
    alert("Currency reset to LKR");
  };

  const forceReload = (hard: boolean) => {
    if (hard) {
      window.location.href = window.location.href;
    } else {
      window.location.reload();
    }
  };

  const toggleFeature = (key: string) => {
    if (!settings) return;
    const currentFeatures = settings.features || {};
    setSettings({
      ...settings,
      features: {
        ...currentFeatures,
        [key]: !currentFeatures[key]
      }
    });
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">System Configuration</h2>
          <p className="text-sm text-gray-500">Manage global flags and client-side utilities</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !settings} className="w-full sm:w-auto">
          {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {localError && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {localError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Global System Settings */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              Global Settings (Firestore)
            </h3>
            
            {settings && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <span className="font-medium text-gray-900 block">Maintenance Mode</span>
                    <span className="text-xs text-gray-500">Blocks non-admin access to the platform</span>
                  </div>
                  <button 
                    onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue ${settings.maintenanceMode ? 'bg-red-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <Input 
                  label="Site Name" 
                  value={settings.siteName} 
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} 
                />
                
                <Input 
                  label="Support Email" 
                  value={settings.supportEmail || ""} 
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} 
                />

                <Input 
                  label="Global Announcement (Optional)" 
                  placeholder="e.g. System maintenance scheduled for..."
                  value={settings.announcement || ""} 
                  onChange={(e) => setSettings({ ...settings, announcement: e.target.value })} 
                />
              </div>
            )}
          </div>

          {/* Feature Flags */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Flag className="w-5 h-5 text-orange-500" />
              Feature Flags
            </h3>
            
            {settings && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Enable Debug Mode</span>
                  <button 
                    onClick={() => toggleFeature('enableDebugMode')}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.features?.enableDebugMode ? 'bg-orange-500' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settings.features?.enableDebugMode ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Enable Beta Features</span>
                  <button 
                    onClick={() => toggleFeature('enableBetaFeatures')}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.features?.enableBetaFeatures ? 'bg-orange-500' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settings.features?.enableBetaFeatures ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Enable New Dashboard</span>
                  <button 
                    onClick={() => toggleFeature('enableNewDashboard')}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.features?.enableNewDashboard ? 'bg-orange-500' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settings.features?.enableNewDashboard ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Environment Variables */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-gray-700" />
              Environment Variables
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2 font-mono text-gray-500">NODE_ENV</td>
                    <td className="py-2 font-mono text-gray-900">{process.env.NODE_ENV}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono text-gray-500">APP_VERSION</td>
                    <td className="py-2 font-mono text-gray-900">v1.2.0</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono text-gray-500">BASE_URL</td>
                    <td className="py-2 font-mono text-gray-900">{typeof window !== 'undefined' ? window.location.origin : 'Server Side'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* System Utilities */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-indigo-500" />
              System Utilities
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={() => forceReload(false)}
                className="justify-start text-sm"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reload App
              </Button>
               <Button 
                variant="outline" 
                onClick={() => forceReload(true)}
                className="justify-start text-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Force Refresh
              </Button>
            </div>
          </div>

          {/* Client Diagnostics */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-purple-500" />
              Client Diagnostics
            </h3>
            
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg text-xs font-mono text-gray-600 break-all">
                <span className="font-bold block mb-1">User Agent:</span>
                {typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                    <span className="font-bold block mb-1">Screen Size:</span>
                    {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A'}
                 </div>
                 <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                    <span className="font-bold block mb-1">Pixel Ratio:</span>
                    {typeof window !== 'undefined' ? window.devicePixelRatio : 'N/A'}
                 </div>
                 <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                    <span className="font-bold block mb-1">Platform:</span>
                    {typeof navigator !== 'undefined' ? navigator.platform : 'N/A'}
                 </div>
                 <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                    <span className="font-bold block mb-1">Language:</span>
                    {typeof navigator !== 'undefined' ? navigator.language : 'N/A'}
                 </div>
              </div>
            </div>
          </div>

          {/* Dangerous Actions */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Dangerous Actions
            </h3>
            
            <div className="space-y-3">
              <Button 
                variant="outline" 
                fullWidth 
                onClick={clearLocalStorage}
                className="justify-start text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Local Storage & Logout
              </Button>

              <div className="h-px bg-gray-100 my-2"></div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="ghost" 
                  onClick={resetTheme}
                  className="justify-start text-sm"
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  Reset Theme
                </Button>
                 <Button 
                  variant="ghost" 
                  onClick={resetCurrency}
                  className="justify-start text-sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Currency
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
