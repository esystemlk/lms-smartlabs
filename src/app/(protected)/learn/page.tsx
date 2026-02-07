"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { bunnyService } from "@/services/bunnyService";
import { recordedClassService, RecordedPackage, RecordedClass, RecordedEnrollment } from "@/services/recordedClassService";
import { settingsService } from "@/services/settingsService";
import { 
  Loader2, Check, Lock, Play, Clock, AlertTriangle, Upload, FileText, 
  CreditCard, ChevronRight, Search, Layout, Maximize2, Minimize2, 
  BookOpen, MessageSquare, Share2, MoreVertical, ListVideo, 
  CheckCircle2, PlayCircle, X
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PayHereCheckout } from "@/components/payment/PayHereCheckout";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function LearnPage() {
  const { user, userData } = useAuth();
  const [enrollment, setEnrollment] = useState<RecordedEnrollment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) checkEnrollment();
  }, [user]);

  const checkEnrollment = async () => {
    if (!user) return;
    try {
      const enr = await recordedClassService.getUserEnrollment(user.uid);
      // Check if expired
      if (enr && enr.expiryDate?.seconds * 1000 > Date.now()) {
        setEnrollment(enr);
      } else {
        setEnrollment(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-blue" /></div>;

  if (enrollment) {
    return <LearnDashboard enrollment={enrollment} />;
  }

  return <PricingPage onPurchaseSuccess={checkEnrollment} />;
}

// --- PRICING PAGE ---
function PricingPage({ onPurchaseSuccess }: { onPurchaseSuccess: () => void }) {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [packages, setPackages] = useState<RecordedPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<RecordedPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'payhere' | 'bank' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const res = await recordedClassService.getPackages();
      setPackages(res.filter(p => p.active));
    } finally {
      setLoading(false);
    }
  };

  if (selectedPackage) {
    return (
      <CheckoutFlow 
        pkg={selectedPackage} 
        userData={userData} 
        onBack={() => { setSelectedPackage(null); setPaymentMethod(null); }} 
        onSuccess={onPurchaseSuccess}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Master English with Recorded Classes</h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">Access our complete library of premium English lessons. Learn at your own pace, anytime, anywhere.</p>
      </div>

      {loading ? (
        <Loader2 className="animate-spin mx-auto" />
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div key={pkg.id} className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800 shadow-xl hover:scale-105 transition-transform duration-300 flex flex-col">
              {pkg.durationMonths === 3 && (
                <div className="absolute top-0 right-0 bg-brand-blue text-white text-xs font-bold px-4 py-1 rounded-bl-xl rounded-tr-3xl">
                  BEST VALUE
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
              <p className="text-gray-500 text-sm mb-6">{pkg.description}</p>
              
              <div className="mb-8">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">LKR {pkg.price.toLocaleString()}</span>
                <span className="text-gray-500 text-sm"> / total</span>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <Check size={14} className="text-green-600" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button 
                onClick={() => setSelectedPackage(pkg)}
                className="w-full py-6 text-lg rounded-xl shadow-lg shadow-blue-500/20"
              >
                Get Started
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- CHECKOUT FLOW ---
function CheckoutFlow({ pkg, userData, onBack, onSuccess }: any) {
  const [method, setMethod] = useState<'payhere' | 'bank' | null>(null);
  const [payhereConfig, setPayhereConfig] = useState<any>(null);
  const { toast } = useToast();

  const handlePayHere = () => {
    // Generate Order ID
    const orderId = `REC-${pkg.id}-${Date.now()}`;
    setPayhereConfig({
      orderId,
      items: `Recorded Class Access - ${pkg.name}`,
      amount: pkg.price,
      currency: "LKR",
      userData: {
        first_name: userData?.firstName || userData?.name?.split(' ')[0] || "Student",
        last_name: userData?.lastName || userData?.name?.split(' ').slice(1).join(' ') || "",
        email: userData?.email,
        phone: userData?.phone || "0770000000",
        address: "Sri Lanka",
        city: "Colombo",
        country: "Sri Lanka"
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Button variant="ghost" onClick={onBack} className="mb-6 pl-0 hover:pl-2 transition-all">← Back to Packages</Button>
      
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-2xl font-bold">Checkout</h2>
          <div className="flex justify-between items-center mt-4">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{pkg.name}</p>
              <p className="text-sm text-gray-500">{pkg.description}</p>
            </div>
            <div className="text-xl font-bold text-brand-blue">LKR {pkg.price.toLocaleString()}</div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {!method ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Select Payment Method</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <button 
                  onClick={() => { setMethod('payhere'); handlePayHere(); }}
                  className="p-6 rounded-2xl border-2 border-gray-100 hover:border-brand-blue hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-900/20 transition-all text-left group"
                >
                  <div className="mb-4 p-3 bg-blue-100 text-brand-blue rounded-xl w-fit group-hover:scale-110 transition-transform">
                    <CreditCard size={24} />
                  </div>
                  <h4 className="font-bold text-lg">Online Payment</h4>
                  <p className="text-sm text-gray-500 mt-1">Instant access via PayHere (Card/Genie/EzCash)</p>
                </button>

                <button 
                  onClick={() => setMethod('bank')}
                  className="p-6 rounded-2xl border-2 border-gray-100 hover:border-brand-blue hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-900/20 transition-all text-left group"
                >
                  <div className="mb-4 p-3 bg-green-100 text-green-600 rounded-xl w-fit group-hover:scale-110 transition-transform">
                    <FileText size={24} />
                  </div>
                  <h4 className="font-bold text-lg">Bank Transfer</h4>
                  <p className="text-sm text-gray-500 mt-1">Manual approval (Takes ~24h)</p>
                </button>
              </div>
            </div>
          ) : method === 'payhere' ? (
            <div className="text-center py-8">
              <Loader2 className="animate-spin mx-auto mb-4 text-brand-blue" size={40} />
              <p className="font-medium">Initializing Payment Gateway...</p>
              <p className="text-sm text-gray-500 mt-2">Please complete the payment in the popup.</p>
              {payhereConfig && (
                <PayHereCheckout 
                  {...payhereConfig}
                  onDismiss={() => { setMethod(null); setPayhereConfig(null); }}
                  onError={(e) => { toast("Payment Error: " + e, "error"); setMethod(null); }}
                />
              )}
            </div>
          ) : (
            <BankTransferForm pkg={pkg} userData={userData} onSuccess={() => { toast("Request submitted! We will notify you once approved.", "success"); setMethod(null); }} />
          )}
        </div>
      </div>
    </div>
  );
}

function BankTransferForm({ pkg, userData, onSuccess }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    bankName: "Sampath Bank",
    accountName: "Smart Labs Pvt Ltd",
    accountNumber: "1234 5678 9000",
    branch: "Colombo Super"
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsService.getSettings();
        if (settings.bankDetails) {
          setBankDetails(settings.bankDetails);
        }
      } catch (e) {
        console.error("Failed to load bank details", e);
      }
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    try {
      await recordedClassService.submitBankTransfer(userData.uid, file, pkg.id, pkg.price, userData);
      onSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-xl flex gap-3">
        <AlertTriangle className="text-yellow-600 shrink-0" />
        <div className="text-sm text-yellow-800 dark:text-yellow-200">
          <p className="font-bold">Important Notice</p>
          <p>Bank transfers take up to 24 hours to verify on weekdays.</p>
          <p className="mt-1 font-medium">Weekends (Saturday/Sunday) are excluded. Payments made on Saturday will be checked on Monday.</p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-bold text-sm uppercase text-gray-500">Bank Details</h4>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-1 text-sm font-medium">
          <p>Bank: <span className="font-bold">{bankDetails.bankName}</span></p>
          <p>Account Name: <span className="font-bold">{bankDetails.accountName}</span></p>
          <p>Account Number: <span className="font-bold">{bankDetails.accountNumber}</span></p>
          <p>Branch: <span className="font-bold">{bankDetails.branch}</span></p>
          <p className="mt-2 text-brand-blue">Amount to Transfer: LKR {pkg.price.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-sm uppercase text-gray-500">Upload Receipt</h4>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer relative">
          <input 
            type="file" 
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            required
          />
          <div className="flex flex-col items-center gap-2">
            <Upload className="text-gray-400" size={32} />
            {file ? (
              <p className="font-bold text-brand-blue">{file.name}</p>
            ) : (
              <>
                <p className="font-medium text-gray-900 dark:text-white">Click to upload receipt</p>
                <p className="text-xs text-gray-500">JPG, PNG or PDF (Max 5MB)</p>
              </>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" fullWidth disabled={!file || submitting} className="h-12 text-lg">
        {submitting ? <Loader2 className="animate-spin" /> : "Submit Payment"}
      </Button>
    </form>
  );
}

// --- DASHBOARD (VIEWER) ---
function LearnDashboard({ enrollment }: { enrollment: RecordedEnrollment }) {
  const [classes, setClasses] = useState<RecordedClass[]>([]);
  const [activeClass, setActiveClass] = useState<RecordedClass | null>(null);
  const [libraryId, setLibraryId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'resources'>('overview');
  const [searchQuery, setSearchQuery] = useState("");
  const [cinemaMode, setCinemaMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Track watch time
  useEffect(() => {
    if (!activeClass || !enrollment.id) return;

    // Update watch time every minute
    const interval = setInterval(() => {
      recordedClassService.updateWatchTime(enrollment.id!, 60);
    }, 60000);

    return () => clearInterval(interval);
  }, [activeClass, enrollment.id]);

  const loadData = async () => {
    try {
      const [clsRes, settings] = await Promise.all([
        recordedClassService.getClasses(),
        bunnyService.getSettings()
      ]);
      const active = clsRes.filter(c => c.active);
      setClasses(active);
      if (active.length > 0) setActiveClass(active[0]);
      setLibraryId(settings.bunnyLibraryId);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = (cls: RecordedClass) => {
    setActiveClass(cls);
    recordedClassService.incrementVideoView(cls.id!);
  };

  const filteredClasses = classes.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="h-[calc(100vh-64px)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-blue" />
        <p className="text-gray-500 font-medium animate-pulse">Loading Classroom...</p>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-500 ${cinemaMode ? 'z-50 fixed inset-0 h-screen bg-black' : ''}`}>
      
      {/* Top Navigation (Hidden in Cinema Mode) */}
      {!cinemaMode && (
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-brand-blue">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white leading-tight">Recorded Classes</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">My Learning Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCinemaMode(true)}
              className="hidden md:flex gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              Cinema Mode
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              <ListVideo className="w-5 h-5" />
            </Button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left: Video & Details */}
        <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
          
          {/* Video Player Container */}
          <div className={`w-full bg-black relative transition-all duration-500 ${cinemaMode ? 'h-full' : 'aspect-video max-h-[70vh]'}`}>
            {cinemaMode && (
               <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCinemaMode(false)}
                className="absolute top-4 right-4 z-50 text-white bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10"
              >
                <Minimize2 className="w-4 h-4 mr-2" /> Exit Cinema
              </Button>
            )}

            {activeClass && libraryId ? (
              <div className="w-full h-full relative group">
                <iframe 
                  src={`https://iframe.mediadelivery.net/embed/${libraryId}/${activeClass.bunnyVideoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`}
                  loading="lazy"
                  className="w-full h-full"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" 
                  allowFullScreen={true}
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                <div className="p-4 rounded-full bg-gray-900">
                  <PlayCircle className="w-12 h-12 opacity-50" />
                </div>
                <p>Select a lesson to start watching</p>
              </div>
            )}
          </div>

          {/* Video Metadata & Tabs (Hidden in Cinema Mode) */}
          {!cinemaMode && (
            <div className="max-w-5xl mx-auto w-full p-6 space-y-8">
              
              {/* Title Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                    {activeClass?.title || "Select a Lesson"}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {activeClass?.durationSeconds ? `${Math.floor(activeClass.durationSeconds / 60)} mins` : '-- mins'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Ready to watch
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="w-4 h-4" /> Share
                  </Button>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-8">
                  <TabButton 
                    active={activeTab === 'overview'} 
                    onClick={() => setActiveTab('overview')} 
                    icon={BookOpen} 
                    label="Overview" 
                  />
                  <TabButton 
                    active={activeTab === 'notes'} 
                    onClick={() => setActiveTab('notes')} 
                    icon={FileText} 
                    label="My Notes" 
                  />
                  <TabButton 
                    active={activeTab === 'resources'} 
                    onClick={() => setActiveTab('resources')} 
                    icon={Layout} 
                    label="Resources" 
                  />
                </div>
              </div>

              {/* Tab Content */}
              <div className="min-h-[200px]">
                {activeTab === 'overview' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="prose dark:prose-invert max-w-none">
                      <h3 className="text-lg font-semibold mb-2">About this lesson</h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {activeClass?.description || "No description available for this lesson."}
                      </p>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                        <h4 className="font-semibold text-sm text-gray-500 mb-1">Instructor</h4>
                        <div className="flex items-center gap-3 mt-3">
                          {activeClass?.instructorImage ? (
                            <img src={activeClass.instructorImage} alt={activeClass.instructorName || "Instructor"} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold">
                              SL
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{activeClass?.instructorName || "Smart Labs"}</p>
                            <p className="text-xs text-gray-500">Senior Lecturer</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                        <h4 className="font-semibold text-sm text-gray-500 mb-1">Learning Status</h4>
                         <div className="mt-3">
                           <div className="flex justify-between text-xs mb-1.5">
                             <span className="font-medium">Progress</span>
                             <span>0%</span>
                           </div>
                           <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                             <div className="w-0 h-full bg-brand-blue rounded-full" />
                           </div>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'notes' && (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                     <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-6 text-center">
                       <FileText className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                       <h3 className="font-bold text-gray-900 dark:text-white">Personal Notes</h3>
                       <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                         Take notes while you watch. Your notes are private and saved automatically.
                       </p>
                       <textarea 
                        className="mt-6 w-full h-40 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black focus:ring-2 focus:ring-brand-blue outline-none resize-none transition-all"
                        placeholder="Start typing your notes here..."
                       />
                     </div>
                   </motion.div>
                )}
                
                {activeTab === 'resources' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {activeClass?.resources && activeClass.resources.length > 0 ? (
                      <div className="grid gap-3">
                        {activeClass.resources.map((res, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-brand-blue transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-brand-blue rounded-lg">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{res.name}</p>
                                <p className="text-xs text-gray-500 uppercase">{res.type.split('/')[1] || 'FILE'} • Download</p>
                              </div>
                            </div>
                            <a 
                              href={res.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                            >
                              <Upload className="w-5 h-5 rotate-180" />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-800">
                        <Layout className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No resources attached to this lesson.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Playlist */}
        <AnimatePresence mode="wait">
          {(!cinemaMode && sidebarOpen) && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col z-10 shrink-0"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg text-gray-900 dark:text-white">Course Content</h2>
                  <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="md:hidden">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search lessons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-none text-sm focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                  />
                </div>

                {/* Progress Summary */}
                <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
                  <span>{classes.length} Lessons</span>
                  <span>{Math.floor(classes.reduce((a,b) => a + (b.durationSeconds||0), 0) / 60)}m Total Duration</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {filteredClasses.length > 0 ? (
                  filteredClasses.map((cls, index) => {
                    const isActive = activeClass?.id === cls.id;
                    return (
                      <button
                        key={cls.id}
                        onClick={() => handleClassSelect(cls)}
                        className={`group w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left border ${
                          isActive
                            ? "bg-brand-blue/5 border-brand-blue/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent"
                        }`}
                      >
                        {/* Thumbnail / Number */}
                        <div className={`w-16 h-10 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden ${
                          isActive ? 'bg-brand-blue text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        }`}>
                          {isActive ? (
                            <div className="flex items-end gap-0.5 h-3 mb-1">
                              <span className="w-1 h-3 bg-white animate-[bounce_1s_infinite]" />
                              <span className="w-1 h-2 bg-white animate-[bounce_1.2s_infinite]" />
                              <span className="w-1 h-3 bg-white animate-[bounce_0.8s_infinite]" />
                            </div>
                          ) : (
                            <span className="text-xs font-bold">{String(index + 1).padStart(2, '0')}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium line-clamp-2 ${
                            isActive ? "text-brand-blue" : "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white"
                          }`}>
                            {cls.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-gray-400 flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                              <Clock size={10} /> {Math.floor((cls.durationSeconds || 0) / 60)}m
                            </span>
                            {isActive && <span className="text-[10px] font-bold text-brand-blue">Playing</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p className="text-sm">No lessons found</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Expand Sidebar Button (When closed) */}
        {(!cinemaMode && !sidebarOpen) && (
          <div className="absolute right-0 top-0 bottom-0 w-12 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col items-center py-4 gap-4 z-10">
             <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(true)}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ListVideo className="w-5 h-5" />
            </Button>
            <div className="h-px w-6 bg-gray-200 dark:bg-gray-800" />
            <div className="flex-1 w-full flex flex-col items-center gap-2">
               {/* Vertical progress or icons could go here */}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-all ${
        active 
          ? "border-brand-blue text-brand-blue" 
          : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
