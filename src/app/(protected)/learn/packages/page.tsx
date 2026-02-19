 "use client";
 
 import { useEffect, useState } from "react";
 import { useAuth } from "@/context/AuthContext";
 import { recordedClassService, RecordedPackage } from "@/services/recordedClassService";
 import { Button } from "@/components/ui/Button";
 import { Loader2, Check, CreditCard, FileText } from "lucide-react";
 import { PayHereCheckout } from "@/components/payment/PayHereCheckout";
 import Link from "next/link";
 
 export default function LearnPackagesPage() {
   const { user, userData } = useAuth();
   const [packages, setPackages] = useState<RecordedPackage[]>([]);
   const [loading, setLoading] = useState(true);
   const [selected, setSelected] = useState<RecordedPackage | null>(null);
   const [method, setMethod] = useState<"payhere" | "bank" | null>(null);
   const [payhereConfig, setPayhereConfig] = useState<any>(null);
   const [submitting, setSubmitting] = useState(false);
   const [file, setFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
 
   useEffect(() => {
     const load = async () => {
       try {
         const res = await recordedClassService.getPackages();
         setPackages(res.filter(p => p.active));
       } finally {
         setLoading(false);
       }
     };
     load();
   }, []);
 
  const categories = Array.from(new Set(["All", ...packages.map(p => p.category || "Uncategorized")]));
  const filteredPackages = selectedCategory === "All" ? packages : packages.filter(p => (p.category || "Uncategorized") === selectedCategory);

   const startPayHere = (pkg: RecordedPackage) => {
     const orderId = `REC-${pkg.id}-${Date.now()}`;
     setPayhereConfig({
       orderId,
       items: `Recorded Class Access - ${pkg.name}`,
       amount: pkg.price,
       currency: "LKR",
       userData: userData || {}
     });
     setMethod("payhere");
   };
 
   const submitBank = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!user || !selected || !file) return;
     setSubmitting(true);
     try {
       await recordedClassService.submitBankTransfer(user.uid, file, selected.id!, selected.price, userData);
       setMethod(null);
       setSelected(null);
       setFile(null);
     } finally {
       setSubmitting(false);
     }
   };
 
   return (
     <div className="max-w-7xl mx-auto p-6 space-y-10">
      <div className="flex items-center justify-between gap-3 flex-wrap">
         <div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900">Recorded Class Subscriptions</h1>
           <p className="text-gray-500 mt-1">Choose a time period to access the full library.</p>
         </div>
         <Link href="/learn">
           <Button variant="ghost">Back to Learn</Button>
         </Link>
       </div>
 
       {loading ? (
         <div className="flex items-center justify-center min-h-[40vh]">
           <Loader2 className="animate-spin text-brand-blue" size={32} />
         </div>
       ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm border ${selectedCategory === cat ? "bg-brand-blue text-white border-brand-blue" : "bg-white border-gray-200 text-gray-700"}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {filteredPackages.map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-xl flex flex-col">
               {pkg.durationMonths === 3 && (
                 <div className="self-end mb-2 text-[10px] px-3 py-1 rounded-full bg-brand-blue text-white font-bold">BEST VALUE</div>
               )}
              <h3 className="text-xl md:text-2xl font-bold mb-2">{pkg.name}</h3>
               <p className="text-sm text-gray-500 mb-6">{pkg.description}</p>
               <div className="mb-6">
                <span className="text-3xl md:text-4xl font-bold">LKR {pkg.price.toLocaleString()}</span>
               </div>
               <ul className="space-y-3 mb-8 flex-1">
                 {pkg.features?.map((f, i) => (
                   <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                     <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                       <Check size={14} className="text-green-600" />
                     </span>
                     {f}
                   </li>
                 ))}
                 <li className="text-xs text-gray-500">Access length: {pkg.durationMonths * 30} days</li>
               </ul>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <Button onClick={() => { setSelected(pkg); startPayHere(pkg); }} className="w-full">
                   <CreditCard className="w-4 h-4 mr-2" />
                   Pay Online
                 </Button>
                 <Button variant="outline" onClick={() => { setSelected(pkg); setMethod("bank"); }} className="w-full">
                   <FileText className="w-4 h-4 mr-2" />
                   Bank Transfer
                 </Button>
               </div>
             </div>
          ))}
          </div>
        </>
       )}
 
       {method === "payhere" && payhereConfig && selected && (
         <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
           <div className="text-sm font-medium mb-2">Initializing payment for {selected.name}</div>
           <div className="flex items-center gap-2 text-sm text-blue-700">
             <Loader2 className="animate-spin" /> Please complete the payment in the popup
           </div>
           <PayHereCheckout
             {...payhereConfig}
             sandbox={true}
             onDismiss={() => { setMethod(null); setPayhereConfig(null); setSelected(null); }}
             onError={() => { setMethod(null); setPayhereConfig(null); setSelected(null); }}
           />
         </div>
       )}
 
       {method === "bank" && selected && (
         <form onSubmit={submitBank} className="rounded-2xl border border-gray-200 p-6 bg-white space-y-4 max-w-2xl">
           <div className="font-semibold">Submit Bank Transfer Receipt</div>
           <div className="text-sm text-gray-500">Package: {selected.name} • Amount: LKR {selected.price.toLocaleString()}</div>
           <div className="border-2 border-dashed rounded-xl p-6 text-center relative">
             <input
               type="file"
               accept="image/*,.pdf"
               onChange={(e) => setFile(e.target.files?.[0] || null)}
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               required
             />
             {file ? (
               <div className="text-sm font-medium">{file.name}</div>
             ) : (
               <div className="text-sm text-gray-500">Click to upload receipt</div>
             )}
           </div>
           <div className="flex gap-3">
             <Button type="submit" disabled={!file || submitting}>
               {submitting ? <Loader2 className="animate-spin" /> : "Submit for Verification"}
             </Button>
             <Button type="button" variant="ghost" onClick={() => { setMethod(null); setSelected(null); setFile(null); }}>
               Cancel
             </Button>
           </div>
         </form>
       )}
     </div>
   );
 }
 
