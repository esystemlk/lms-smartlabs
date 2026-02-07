"use client";

import { useState, useEffect } from "react";
import { recordedClassService, RecordedClass, RecordedPackage, BankTransferRequest, RecordedEnrollment } from "@/services/recordedClassService";
import { bunnyService } from "@/services/bunnyService";
import { Loader2, Plus, Play, Check, X, RefreshCw, DollarSign, Users, Clock, FileText, ExternalLink, Edit, Trash2, Upload, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Image from "next/image";

export default function RecordedClassesAdmin() {
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'packages' | 'transfers' | 'students'>('overview');
  
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recorded Classes Management</h1>
          <p className="text-sm text-gray-500">Manage videos, packages, and student enrollments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview', icon: Users },
          { id: 'classes', label: 'Classes', icon: Play },
          { id: 'packages', label: 'Packages', icon: DollarSign },
          { id: 'transfers', label: 'Bank Transfers', icon: FileText },
          { id: 'students', label: 'Students', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-800 text-brand-blue border-b-2 border-brand-blue shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 min-h-[500px] p-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'classes' && <ClassesTab />}
        {activeTab === 'packages' && <PackagesTab />}
        {activeTab === 'transfers' && <TransfersTab />}
        {activeTab === 'students' && <StudentsTab />}
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

function OverviewTab() {
  const [stats, setStats] = useState({ activeStudents: 0, totalRevenue: 0, pendingTransfers: 0, totalViews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const enrollments = await recordedClassService.getAllEnrollments();
      const transfers = await recordedClassService.getPendingBankTransfers();
      const classes = await recordedClassService.getClasses();

      const active = enrollments.filter(e => e.status === 'active').length;
      // Revenue calculation is approximate based on package info if stored, but we don't store price in enrollment yet. 
      // For now, just count active students.
      
      const views = classes.reduce((acc, curr) => acc + (curr.views || 0), 0);

      setStats({
        activeStudents: active,
        totalRevenue: 0, // Need to track price at enrollment time for accurate revenue
        pendingTransfers: transfers.length,
        totalViews: views
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-blue" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Active Students" value={stats.activeStudents} icon={Users} color="blue" />
        <StatCard title="Pending Transfers" value={stats.pendingTransfers} icon={FileText} color="orange" />
        <StatCard title="Total Video Views" value={stats.totalViews} icon={Play} color="purple" />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
  };
  return (
    <div className="p-6 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-4">
      <div className={`p-4 rounded-xl ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
      </div>
    </div>
  );
}

function ClassesTab() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<RecordedClass[]>([]);
  const [bunnyVideos, setBunnyVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [editingClass, setEditingClass] = useState<RecordedClass | null>(null);
  
  // Resource Upload State
  const [uploadingRes, setUploadingRes] = useState(false);
  const [newResName, setNewResName] = useState("");
  const [newResFile, setNewResFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dbClasses, apiVideos] = await Promise.all([
        recordedClassService.getClasses(),
        bunnyService.getVideos(1, 100)
      ]);
      setClasses(dbClasses);
      setBunnyVideos(apiVideos.items || []);
    } catch (e) {
      toast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (video: any) => {
    setSyncing(true);
    try {
      await recordedClassService.syncClass({
        bunnyVideoId: video.guid,
        title: video.title,
        durationSeconds: video.length,
        order: Date.now(),
        active: true,
        views: 0,
        thumbnailUrl: `https://${video.thumbnailFileName}`
      });
      toast("Class synced successfully", "success");
      loadData();
    } catch (e) {
      toast("Sync failed", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !editingClass.id) return;
    
    try {
      await recordedClassService.updateClass(editingClass.id, editingClass);
      toast("Class updated successfully", "success");
      setEditingClass(null);
      loadData();
    } catch (err) {
      toast("Update failed", "error");
    }
  };

  const handleInstructorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !editingClass) return;
    const file = e.target.files[0];
    try {
      toast("Uploading image...", "info");
      const url = await recordedClassService.uploadResource(file);
      setEditingClass({ ...editingClass, instructorImage: url });
      toast("Image uploaded", "success");
    } catch (err) {
      toast("Upload failed", "error");
    }
  };

  const handleResourceUpload = async () => {
    if (!newResFile || !newResName || !editingClass) return;
    setUploadingRes(true);
    try {
      const url = await recordedClassService.uploadResource(newResFile);
      const newResource = { name: newResName, url, type: newResFile.type };
      const updatedResources = [...(editingClass.resources || []), newResource];
      
      setEditingClass({ ...editingClass, resources: updatedResources });
      
      // Reset form
      setNewResName("");
      setNewResFile(null);
      toast("Resource added to list (Click Save to persist)", "success");
    } catch (err) {
      toast("Resource upload failed", "error");
    } finally {
      setUploadingRes(false);
    }
  };

  const removeResource = (index: number) => {
    if (!editingClass) return;
    const updated = [...(editingClass.resources || [])];
    updated.splice(index, 1);
    setEditingClass({ ...editingClass, resources: updated });
  };

  const deleteClass = async (id: string) => {
    if (!confirm("Are you sure? This removes it from the 'Learn' page but keeps the video in Bunny.")) return;
    try {
      await recordedClassService.deleteClass(id);
      loadData();
    } catch (e) {
      toast("Delete failed", "error");
    }
  };

  if (loading) return <Loader2 className="animate-spin mx-auto" />;

  return (
    <div className="space-y-8 relative">
      {/* Edit Modal */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h3 className="font-bold text-xl">Edit Class Details</h3>
              <Button variant="ghost" size="icon" onClick={() => setEditingClass(null)}><X size={20} /></Button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input 
                      value={editingClass.title} 
                      onChange={e => setEditingClass({...editingClass, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Instructor Name</label>
                    <Input 
                      value={editingClass.instructorName || ''} 
                      onChange={e => setEditingClass({...editingClass, instructorName: e.target.value})}
                      placeholder="e.g. Dr. Smith"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (Overview)</label>
                  <textarea 
                    className="w-full h-32 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent p-3 text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                    value={editingClass.description || ''}
                    onChange={e => setEditingClass({...editingClass, description: e.target.value})}
                    placeholder="What is this lesson about?"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Instructor Image</label>
                  <div className="flex items-center gap-4">
                    {editingClass.instructorImage && (
                      <img src={editingClass.instructorImage} alt="Instructor" className="w-12 h-12 rounded-full object-cover border" />
                    )}
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleInstructorImageUpload}
                      />
                      <Button type="button" variant="outline" size="sm">
                        <ImageIcon size={16} className="mr-2" /> Upload Photo
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <label className="font-medium flex items-center gap-2">
                    <LinkIcon size={16} /> Attached Resources
                  </label>
                  
                  {/* Resource List */}
                  <div className="space-y-2">
                    {(editingClass.resources || []).map((res, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={14} className="text-gray-400" />
                          <span className="truncate max-w-[200px]">{res.name}</span>
                        </div>
                        <button type="button" onClick={() => removeResource(idx)} className="text-red-500 hover:text-red-600">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {(editingClass.resources || []).length === 0 && (
                      <p className="text-xs text-gray-400 italic">No resources attached.</p>
                    )}
                  </div>

                  {/* Add Resource */}
                  <div className="flex gap-2 items-end bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs text-gray-500">Resource Name</label>
                      <Input 
                        value={newResName}
                        onChange={e => setNewResName(e.target.value)}
                        placeholder="e.g. Lecture Slides"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs text-gray-500">File</label>
                      <input 
                        type="file"
                        className="text-xs w-full"
                        onChange={e => setNewResFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={handleResourceUpload}
                      disabled={!newResFile || !newResName || uploadingRes}
                    >
                      {uploadingRes ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-800">
                <Button type="button" variant="ghost" onClick={() => setEditingClass(null)}>Cancel</Button>
                <Button type="submit" disabled={uploadingRes}>Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Published List */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Published Classes ({classes.length})</h3>
        <div className="grid gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 gap-4">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden group">
                  {cls.thumbnailUrl ? (
                    <img src={cls.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Play size={20} className="text-gray-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm md:text-base truncate">{cls.title}</h4>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span>{Math.floor((cls.durationSeconds || 0) / 60)} mins</span>
                    <span>{cls.views} views</span>
                    <span className={cls.active ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                      {cls.active ? "Active" : "Hidden"}
                    </span>
                    {(cls.resources?.length || 0) > 0 && (
                      <span className="flex items-center gap-1 text-blue-500">
                        <LinkIcon size={10} /> {cls.resources?.length} Resources
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-auto">
                <Button variant="outline" size="sm" onClick={() => setEditingClass(cls)}>
                  <Edit size={14} className="mr-2" /> Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cls.active ? "text-orange-500 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}
                  onClick={() => {
                    if (cls.id) recordedClassService.toggleClassStatus(cls.id, !cls.active).then(loadData);
                  }}
                >
                  {cls.active ? "Hide" : "Show"}
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => cls.id && deleteClass(cls.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
          {classes.length === 0 && <p className="text-center text-gray-500 py-8">No classes published yet.</p>}
        </div>
      </div>

      {/* Available in Bunny */}
      <div className="space-y-4 pt-8 border-t dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Available in Bunny.net ({bunnyVideos.length})</h3>
          <Button variant="outline" size="sm" onClick={loadData}><RefreshCw size={14} className="mr-2" /> Refresh</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
          {bunnyVideos.map((video) => {
            const isSynced = classes.some(c => c.bunnyVideoId === video.guid);
            return (
              <div key={video.guid} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
                <div className="truncate pr-4">
                  <p className="font-medium text-sm truncate">{video.title}</p>
                  <p className="text-xs text-gray-500">{(video.length / 60).toFixed(1)} mins</p>
                </div>
                {isSynced ? (
                  <span className="text-xs font-bold text-green-500 flex items-center gap-1"><Check size={12} /> Synced</span>
                ) : (
                  <Button size="sm" onClick={() => handleSync(video)} disabled={syncing}>
                    <Plus size={14} className="mr-1" /> Add
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PackagesTab() {
  const { toast } = useToast();
  const [packages, setPackages] = useState<RecordedPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<RecordedPackage | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    const res = await recordedClassService.getPackages();
    // Ensure we have 3 default packages if empty
    if (res.length === 0) {
      const defaults: RecordedPackage[] = [
        { name: "1 Month Access", durationMonths: 1, price: 5000, description: "Full access for 30 days", active: true, features: ["All Recorded Classes", "24/7 Access"] },
        { name: "2 Months Access", durationMonths: 2, price: 9000, description: "Full access for 60 days", active: true, features: ["Save 10%", "All Recorded Classes"] },
        { name: "3 Months Access", durationMonths: 3, price: 12000, description: "Full access for 90 days", active: true, features: ["Save 20%", "Priority Support"] },
      ];
      for (const d of defaults) await recordedClassService.createPackage(d);
      setPackages(await recordedClassService.getPackages());
    } else {
      setPackages(res);
    }
    setLoading(false);
  };

  const handleSave = async (pkg: RecordedPackage) => {
    try {
      if (pkg.id) {
        await recordedClassService.updatePackage(pkg.id, pkg);
      } else {
        await recordedClassService.createPackage(pkg);
      }
      toast("Package saved", "success");
      setEditing(null);
      loadPackages();
    } catch (e) {
      toast("Save failed", "error");
    }
  };

  if (loading) return <Loader2 className="animate-spin mx-auto" />;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {packages.map((pkg) => (
        <div key={pkg.id} className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col gap-4">
          {editing?.id === pkg.id && editing ? (
            <div className="space-y-3">
              <Input value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Name" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">LKR</span>
                <Input type="number" value={editing.price} onChange={e => setEditing({...editing, price: Number(e.target.value)})} placeholder="Price" />
              </div>
              <Input value={editing.description} onChange={e => setEditing({...editing, description: e.target.value})} placeholder="Description" />
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={() => handleSave(editing)}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h3 className="font-bold text-lg">{pkg.name}</h3>
                <p className="text-sm text-gray-500">{pkg.description}</p>
              </div>
              <div className="text-3xl font-bold text-brand-blue">
                LKR {pkg.price.toLocaleString()}
              </div>
              <ul className="text-sm text-gray-600 space-y-2 flex-1">
                {pkg.features.map((f, i) => <li key={i} className="flex gap-2"><Check size={16} className="text-green-500" /> {f}</li>)}
              </ul>
              <Button variant="outline" onClick={() => setEditing(pkg)}>Edit Price & Details</Button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function TransfersTab() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<BankTransferRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const res = await recordedClassService.getPendingBankTransfers();
    setRequests(res);
    setLoading(false);
  };

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    if (!confirm(`Are you sure you want to ${action} this request?`)) return;
    try {
      await recordedClassService.processBankTransfer(id, action);
      toast(`Request ${action}`, "success");
      loadRequests();
    } catch (e) {
      toast("Action failed", "error");
    }
  };

  if (loading) return <Loader2 className="animate-spin mx-auto" />;

  return (
    <div className="space-y-4">
      {requests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No pending bank transfers</div>
      ) : (
        requests.map((req) => (
          <div key={req.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                <Clock size={24} />
              </div>
              <div>
                <h4 className="font-bold">{req.userName}</h4>
                <p className="text-sm text-gray-500">{req.userEmail}</p>
                <div className="flex items-center gap-4 mt-1 text-xs font-medium">
                  <span className="text-brand-blue">LKR {req.amount.toLocaleString()}</span>
                  <span className="text-gray-400">{new Date(req.submittedAt?.seconds * 1000).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <a 
                href={req.receiptUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline px-4"
              >
                <FileText size={16} /> View Receipt
              </a>
              <Button size="sm" onClick={() => req.id && handleAction(req.id, 'approved')} className="bg-green-600 hover:bg-green-700">
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => req.id && handleAction(req.id, 'rejected')} className="text-red-600 border-red-200 hover:bg-red-50">
                Reject
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function StudentsTab() {
  const [students, setStudents] = useState<RecordedEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await recordedClassService.getAllEnrollments();
      setStudents(res);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Loader2 className="animate-spin mx-auto" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3">Student</th>
            <th className="px-6 py-3">Package</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Watch Time</th>
            <th className="px-6 py-3">Expiry</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id} className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
              <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                <div>{s.userName}</div>
                <div className="text-xs text-gray-500">{s.userEmail}</div>
              </td>
              <td className="px-6 py-4">{s.packageName}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {s.status.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4">{Math.floor(s.totalWatchTimeSeconds / 60)} mins</td>
              <td className="px-6 py-4">{s.expiryDate?.seconds ? new Date(s.expiryDate.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
