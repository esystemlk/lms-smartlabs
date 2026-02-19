 "use client";
 
import { useEffect, useState } from "react";
 import { useRouter } from "next/navigation";
import Link from "next/link";
 import { useAuth } from "@/context/AuthContext";
import { recordedClassService, RecordedPackage, RecordedPackageCategory } from "@/services/recordedClassService";
 import { Button } from "@/components/ui/Button";
import { Loader2, Plus, Edit, ToggleLeft, ToggleRight, Trash2, ExternalLink } from "lucide-react";
 
 export default function RecordedPackagesAdminPage() {
   const { userData, loading: authLoading } = useAuth();
   const router = useRouter();
   const [packages, setPackages] = useState<RecordedPackage[]>([]);
   const [loading, setLoading] = useState(true);
   const [showForm, setShowForm] = useState(false);
   const [editing, setEditing] = useState<RecordedPackage | null>(null);
   const [form, setForm] = useState<RecordedPackage>({
     name: "",
     durationMonths: 1,
     price: 0,
     description: "",
     active: true,
    features: [],
    category: ""
   });
  const [categories, setCategories] = useState<RecordedPackageCategory[]>([]);
  const [newCategory, setNewCategory] = useState<string>("");
  const [catSaving, setCatSaving] = useState(false);
 
   useEffect(() => {
     if (!authLoading && userData) {
       const allowed = ["admin", "superadmin", "developer"];
       if (!userData.role || !allowed.includes(userData.role)) {
         router.push("/dashboard");
       } else {
        load();
       }
     }
   }, [userData, authLoading, router]);
 
   const load = async () => {
     setLoading(true);
     try {
      const [pkgs, cats] = await Promise.all([
        recordedClassService.getPackages(),
        recordedClassService.getCategories()
      ]);
      setPackages(pkgs.sort((a, b) => (a.durationMonths || 0) - (b.durationMonths || 0)));
      setCategories(cats);
     } finally {
       setLoading(false);
     }
   };
 
   const openNew = () => {
     setEditing(null);
     setForm({
       name: "",
       durationMonths: 1,
       price: 0,
       description: "",
       active: true,
      features: [],
      category: ""
     });
     setShowForm(true);
   };
 
  const openEdit = (pkg: RecordedPackage) => {
     setEditing(pkg);
    setForm({ ...pkg, features: pkg.features || [], category: pkg.category || "" });
     setShowForm(true);
   };
 
   const save = async () => {
     if (editing?.id) {
       await recordedClassService.updatePackage(editing.id, {
         name: form.name,
         durationMonths: form.durationMonths,
         price: form.price,
         description: form.description,
         active: form.active,
        features: form.features,
        category: form.category || undefined
       });
     } else {
       await recordedClassService.createPackage({
         name: form.name,
         durationMonths: form.durationMonths,
         price: form.price,
         description: form.description,
         active: form.active,
        features: form.features,
        category: form.category || undefined
       });
     }
     setShowForm(false);
     setEditing(null);
     await load();
   };
 
   const toggleActive = async (pkg: RecordedPackage) => {
     if (!pkg.id) return;
     await recordedClassService.updatePackage(pkg.id, { active: !pkg.active });
     await load();
   };
  const deletePkg = async (pkg: RecordedPackage) => {
    if (!pkg.id) return;
    const ok = window.confirm(`Delete package "${pkg.name}"?`);
    if (!ok) return;
    await recordedClassService.deletePackage(pkg.id);
    await load();
  };
 
   if (authLoading) {
     return (
       <div className="flex items-center justify-center min-h-[60vh]">
         <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
       </div>
     );
   }
 
   return (
     <div className="max-w-6xl mx-auto p-6 space-y-6">
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold">Recorded Packages</h1>
           <p className="text-gray-500">Create and manage access packages (30/60/90 days)</p>
         </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/learn/packages")}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Learn Page
          </Button>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" />
            New Package
          </Button>
        </div>
       </div>
 
        {loading ? (
         <div className="flex items-center justify-center py-20">
           <Loader2 className="animate-spin text-brand-blue" />
         </div>
       ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full">
             <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
               <tr>
                  <th className="text-left px-3 py-2 md:px-6 md:py-3">Name</th>
                  <th className="hidden sm:table-cell text-left px-3 py-2 md:px-6 md:py-3">Category</th>
                  <th className="text-left px-3 py-2 md:px-6 md:py-3">Duration</th>
                  <th className="text-left px-3 py-2 md:px-6 md:py-3">Price (LKR)</th>
                  <th className="hidden sm:table-cell text-left px-3 py-2 md:px-6 md:py-3">Status</th>
                  <th className="text-right px-3 py-2 md:px-6 md:py-3">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {packages.map((pkg) => (
                 <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 md:px-6 md:py-4">
                     <div className="font-semibold">{pkg.name}</div>
                      <div className="hidden sm:block text-xs text-gray-500">{pkg.description}</div>
                   </td>
                    <td className="hidden sm:table-cell px-3 py-3 md:px-6 md:py-4">{pkg.category || "Uncategorized"}</td>
                    <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">{pkg.durationMonths * 30} days</td>
                    <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">LKR {pkg.price.toLocaleString()}</td>
                    <td className="hidden sm:table-cell px-3 py-3 md:px-6 md:py-4">
                     <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${pkg.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                       {pkg.active ? "Active" : "Inactive"}
                     </span>
                   </td>
                    <td className="px-3 py-3 md:px-6 md:py-4">
                      <div className="flex justify-end gap-2 flex-wrap md:flex-nowrap">
                       <Button variant="outline" onClick={() => openEdit(pkg)}>
                         <Edit className="w-4 h-4 mr-2" />
                         Edit
                       </Button>
                       <Button variant="ghost" onClick={() => toggleActive(pkg)}>
                         {pkg.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                       </Button>
                      <Button variant="ghost" className="text-red-600" onClick={() => deletePkg(pkg)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                     </div>
                   </td>
                 </tr>
               ))}
             </tbody>
            </table>
            </div>
         </div>
       )}
 
       {showForm && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-5">
             <div className="text-lg font-bold">{editing ? "Edit Package" : "New Package"}</div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-xs font-medium text-gray-600">Name</label>
                 <input
                   value={form.name}
                   onChange={(e) => setForm({ ...form, name: e.target.value })}
                   className="w-full border border-gray-200 rounded-xl px-3 py-2"
                   placeholder="30 Days Access"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-medium text-gray-600">Main Course</label>
                 <div className="flex gap-2">
                   <select
                     value={form.category || ""}
                     onChange={(e) => setForm({ ...form, category: e.target.value })}
                     className="w-full border border-gray-200 rounded-xl px-3 py-2"
                   >
                     <option value="">Uncategorized</option>
                     {categories.filter(c => c.active).map(c => (
                       <option key={c.id} value={c.name}>{c.name}</option>
                     ))}
                   </select>
                 </div>
                 <div className="flex gap-2 mt-2">
                   <input
                     value={newCategory}
                     onChange={(e) => setNewCategory(e.target.value)}
                     placeholder="Add new main course"
                     className="flex-1 border border-gray-200 rounded-xl px-3 py-2"
                   />
                   <Button
                     onClick={async () => {
                       if (!newCategory.trim()) return;
                       setCatSaving(true);
                       try {
                         await recordedClassService.createCategory(newCategory.trim());
                         const cats = await recordedClassService.getCategories();
                         setCategories(cats);
                         setForm({ ...form, category: newCategory.trim() });
                         setNewCategory("");
                       } finally {
                         setCatSaving(false);
                       }
                     }}
                     disabled={catSaving}
                   >
                     {catSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                   </Button>
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-medium text-gray-600">Duration (Months)</label>
                 <input
                   type="number"
                   min={1}
                   value={form.durationMonths}
                   onChange={(e) => setForm({ ...form, durationMonths: Number(e.target.value) })}
                   className="w-full border border-gray-200 rounded-xl px-3 py-2"
                   placeholder="1"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-medium text-gray-600">Price (LKR)</label>
                 <input
                   type="number"
                   min={0}
                   value={form.price}
                   onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                   className="w-full border border-gray-200 rounded-xl px-3 py-2"
                   placeholder="5000"
                 />
               </div>
               <div className="space-y-1 md:col-span-2">
                 <label className="text-xs font-medium text-gray-600">Description</label>
                 <input
                   value={form.description}
                   onChange={(e) => setForm({ ...form, description: e.target.value })}
                   className="w-full border border-gray-200 rounded-xl px-3 py-2"
                   placeholder="Access to entire library"
                 />
               </div>
               <div className="space-y-1 md:col-span-2">
                 <label className="text-xs font-medium text-gray-600">Features (comma separated)</label>
                 <input
                   value={form.features?.join(", ") || ""}
                   onChange={(e) => setForm({ ...form, features: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                   className="w-full border border-gray-200 rounded-xl px-3 py-2"
                   placeholder="Full library, Notes download, Priority support"
                 />
               </div>
               <div className="flex items-center gap-2 md:col-span-2">
                 <input
                   id="active"
                   type="checkbox"
                   checked={form.active}
                   onChange={(e) => setForm({ ...form, active: e.target.checked })}
                 />
                 <label htmlFor="active" className="text-sm">Active</label>
               </div>
             </div>
             <div className="flex justify-end gap-3">
               <Button variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
               <Button onClick={save}>
                 {editing ? "Save Changes" : "Create Package"}
               </Button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }
 
