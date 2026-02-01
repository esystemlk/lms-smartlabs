"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Save, Trash2, Clock, AlertTriangle, Zap, Video, CheckCircle, XCircle } from "lucide-react";

export default function SettingsPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ type: string, success: boolean, message: string } | null>(null);

  const [settings, setSettings] = useState({
    recordingExpirationDays: 30, // Default 30 days
    bunnyLibraryId: "",
    bunnyApiKey: "", // Note: In a real app, don't display full API keys
    bunnyCdnHostname: ""
  });

  useEffect(() => {
    // Only admin/superadmin
    if (userData && !["admin", "superadmin", "developer"].includes(userData.role)) {
      router.push("/dashboard");
      return;
    }
    fetchSettings();
  }, [userData]);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, "settings", "general");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          recordingExpirationDays: data.recordingExpirationDays || 30,
          bunnyLibraryId: data.bunnyLibraryId || "",
          bunnyApiKey: data.bunnyApiKey || "",
          bunnyCdnHostname: data.bunnyCdnHostname || ""
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const [cleanupResult, setCleanupResult] = useState<any>(null);
  const [cleaning, setCleaning] = useState(false);

  const handleRunCleanup = async () => {
    if (!confirm("This will permanently delete recordings older than " + settings.recordingExpirationDays + " days from Bunny.net. Are you sure?")) return;
    
    setCleaning(true);
    setCleanupResult(null);
    try {
      const res = await fetch('/api/cron/cleanup-recordings');
      const data = await res.json();
      setCleanupResult(data);
    } catch (error) {
      console.error("Cleanup failed:", error);
      setCleanupResult({ error: "Failed to run cleanup" });
    } finally {
      setCleaning(false);
    }
  };

  const handleTestConnection = async (type: 'zoom' | 'bunny') => {
    setTestingConnection(type);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type, 
          config: type === 'bunny' ? { 
            libraryId: settings.bunnyLibraryId, 
            apiKey: settings.bunnyApiKey 
          } : undefined 
        })
      });
      const data = await res.json();
      setTestResult({ type, success: data.success, message: data.message });
    } catch (error) {
      setTestResult({ type, success: false, message: "Connection check failed." });
    } finally {
      setTestingConnection(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "general"), {
        ...settings,
        updatedAt: new Date().toISOString(),
        updatedBy: userData?.uid
      }, { merge: true });
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20 space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-500">Manage global configurations for the LMS.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Recording Retention Policy */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="text-orange-500" size={20} />
            Recording Retention Policy
          </h2>
          <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-sm mb-6 border border-orange-100 flex gap-3">
            <AlertTriangle className="shrink-0 mt-0.5" size={16} />
            <p>
              Class recordings will be automatically deleted from Bunny.net after the specified number of days to save storage costs.
              Set to 0 to disable auto-deletion.
            </p>
          </div>
          
          <div className="max-w-xs">
            <Input
              label="Keep Recordings For (Days)"
              type="number"
              min="0"
              value={settings.recordingExpirationDays}
              onChange={(e) => setSettings({ ...settings, recordingExpirationDays: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleRunCleanup}
              disabled={cleaning || settings.recordingExpirationDays === 0}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              {cleaning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Run Cleanup Now
            </Button>
            {cleanupResult && (
              <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                <p>Found: {cleanupResult.found}, Deleted: {cleanupResult.deleted}, Failed: {cleanupResult.failed}</p>
                {cleanupResult.error && <p className="text-red-500">{cleanupResult.error}</p>}
              </div>
            )}
          </div>
        </section>

        {/* Zoom Configuration Status */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Video className="text-blue-500" size={20} />
              Zoom Integration Status
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleTestConnection('zoom')}
              disabled={!!testingConnection}
            >
              {testingConnection === 'zoom' ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test Connection"}
            </Button>
          </div>
          <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <p className="mb-2">Zoom credentials are managed via server-side environment variables for security.</p>
            <div className="flex flex-col gap-1 text-xs text-gray-500 font-mono">
              <p>ZOOM_ACCOUNT_ID: {process.env.NEXT_PUBLIC_ZOOM_ACCOUNT_ID ? "********" : "Hidden (Server-Side)"}</p>
              <p>ZOOM_CLIENT_ID: {process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID ? "********" : "Hidden (Server-Side)"}</p>
            </div>
            {testResult?.type === 'zoom' && (
              <div className={`mt-3 flex items-center gap-2 ${testResult.success ? "text-green-600" : "text-red-600"}`}>
                {testResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <span className="font-medium">{testResult.message}</span>
              </div>
            )}
          </div>
        </section>

        {/* Bunny.net Configuration */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Zap className="text-purple-500" size={20} />
              Bunny.net Stream Configuration
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleTestConnection('bunny')}
              disabled={!!testingConnection || !settings.bunnyLibraryId || !settings.bunnyApiKey}
            >
              {testingConnection === 'bunny' ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test Connection"}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Library ID"
              value={settings.bunnyLibraryId}
              onChange={(e) => setSettings({ ...settings, bunnyLibraryId: e.target.value })}
              placeholder="e.g. 123456"
            />
            <Input
              label="API Key"
              type="password"
              value={settings.bunnyApiKey}
              onChange={(e) => setSettings({ ...settings, bunnyApiKey: e.target.value })}
              placeholder="Stream API Key"
            />
            <div className="md:col-span-2">
              <Input
                label="CDN Hostname"
                value={settings.bunnyCdnHostname}
                onChange={(e) => setSettings({ ...settings, bunnyCdnHostname: e.target.value })}
                placeholder="e.g. video.smartlabs.com"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to use default Bunny.net hostname.</p>
            </div>
          </div>
          {testResult?.type === 'bunny' && (
            <div className={`mt-4 p-3 rounded-lg border ${testResult.success ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-700"} flex items-center gap-2`}>
              {testResult.success ? <CheckCircle size={18} /> : <XCircle size={18} />}
              <span className="text-sm font-medium">{testResult.message}</span>
            </div>
          )}
        </section>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={saving}
            className="bg-brand-blue hover:bg-blue-700 text-white min-w-[150px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}