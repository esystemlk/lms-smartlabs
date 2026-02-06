"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  User
} from "firebase/auth";
import { doc, getDoc, getDocFromServer, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, Lock, User as UserIcon, Phone, Globe, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { countries } from "@/data/countries";

type AuthMode = "login" | "register" | "forgot-password";

export default function LoginPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Register specific states
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [country, setCountry] = useState("Sri Lanka");
  
  // Handle existing session
  useEffect(() => {
    if (!authLoading && authUser) {
      router.push("/dashboard");
    }
  }, [authUser, authLoading, router]);

  // Process user after successful authentication
  const processAuthUser = async (user: User) => {
    setLoading(true);
    try {
      let userDoc;
      try {
        userDoc = await getDocFromServer(doc(db, "users", user.uid));
      } catch (e) {
        userDoc = await getDoc(doc(db, "users", user.uid));
      }

      if (userDoc.exists()) {
        router.push("/dashboard");
      } else {
        const developerEmails = ["tikfese@gmail.com", "thimira.vishwa2003@gmail.com"];
        const role = developerEmails.includes(user.email || "") ? "developer" : "student";
        
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: user.displayName || name || "New User",
          email: user.email || "",
          role,
          contact: contact || "",
          country: country || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          authProvider: "google"
        });

        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Error processing user:", err);
      setError("Failed to process login details.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await processAuthUser(userCredential.user);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password.");
      } else if (err.code === 'auth/user-not-found') {
        setError("No account found with this email.");
      } else if (err.code === 'auth/wrong-password') {
        setError("Incorrect password.");
      } else {
        setError("Failed to login. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        name,
        email,
        contact,
        country,
        role: "student",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        authProvider: "email"
      });

      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Email is already registered.");
      } else {
        setError("Failed to create account. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await processAuthUser(result.user);
    } catch (err: any) {
      console.error(err);
      setError("Failed to sign in with Google.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset link sent to your email!");
    } catch (err: any) {
      setError("Failed to send reset email. Please check the address.");
    } finally {
      setLoading(false);
    }
  };

  const GoogleButton = () => (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      {loading ? (
        <Loader2 className="animate-spin w-5 h-5 text-gray-400" />
      ) : (
        <>
          <div className="w-5 h-5 relative">
            <Image 
              src="https://www.svgrepo.com/show/475656/google-color.svg" 
              alt="Google" 
              fill 
              className="object-contain" 
            />
          </div>
          <span className="group-hover:text-gray-900">Continue with Google</span>
        </>
      )}
    </button>
  );

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-[#0f172a]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-950 z-10" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-blue/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-[80px]" />
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 z-20 opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-30 w-full max-w-6xl mx-auto p-4 flex flex-col md:flex-row items-center gap-12 lg:gap-24">
        
        {/* Left Side: Brand & Welcome */}
        <div className="hidden md:flex flex-col flex-1 text-white space-y-8 animate-fade-in-up">
          <div className="w-64 h-20 relative">
             {/* Brand Logo */}
             <div className="flex items-center gap-4">
               <div className="w-16 h-16 relative shadow-lg shadow-blue-500/20 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/10 p-2">
                 <Image 
                   src="/logo.png" 
                   alt="Smart Labs Logo" 
                   fill 
                   className="object-contain"
                   priority
                 />
               </div>
               <div>
                 <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">SMART LABS</h1>
                 <p className="text-xs text-blue-200 tracking-[0.2em] uppercase font-medium">LMS Portal</p>
               </div>
             </div>
          </div>
          
          <div className="space-y-4 max-w-lg">
            <h2 className="text-5xl font-bold leading-tight font-display">
              Master English <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                The Smart Way
              </span>
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Join thousands of students achieving their goals with our advanced learning platform. Interactive lessons, live classes, and a supportive community await.
            </p>
          </div>

          <div className="flex items-center gap-8 pt-4">
            <div className="flex -space-x-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs font-bold">
                  {/* Placeholder avatars */}
                  <div className={`w-full h-full rounded-full bg-gradient-to-br from-blue-${i}00 to-purple-${i}00 opacity-80`} />
                </div>
              ))}
            </div>
            <div>
              <p className="font-bold text-white">2,000+ Students</p>
              <p className="text-xs text-slate-400">Trust Smart Labs</p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="w-full md:w-[420px] animate-scale-in">
          <div className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
            {/* Decorative Top Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue via-purple-500 to-brand-blue opacity-50" />

            <div className="mb-8 text-center md:text-left">
               {/* Mobile Logo */}
               <div className="md:hidden flex flex-col items-center justify-center mb-8">
                 <div className="w-16 h-16 relative mb-3 drop-shadow-xl">
                   <Image 
                     src="/logo.png" 
                     alt="Smart Labs Logo" 
                     fill 
                     className="object-contain"
                   />
                 </div>
                 <h2 className="text-xl font-bold text-gray-900">SMART LABS</h2>
               </div>

              <h3 className="text-2xl font-bold text-gray-900">
                {mode === 'login' && "Welcome Back"}
                {mode === 'register' && "Create Account"}
                {mode === 'forgot-password' && "Reset Password"}
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                {mode === 'login' && "Enter your details to access your account"}
                {mode === 'register' && "Start your learning journey today"}
                {mode === 'forgot-password' && "We'll send you a link to reset it"}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                <div className="text-red-500 mt-0.5"><Lock size={16} /></div>
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 flex items-start gap-3">
                <div className="text-green-500 mt-0.5"><Globe size={16} /></div>
                <p className="text-sm text-green-600 font-medium">{successMessage}</p>
              </div>
            )}

            {/* Forms */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-sm font-medium"
                      placeholder="student@smartlabs.lk"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Password</label>
                    <button 
                      type="button" 
                      onClick={() => setMode('forgot-password')}
                      className="text-xs text-brand-blue hover:text-blue-700 font-medium transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-sm font-medium"
                      placeholder="••••••••"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" fullWidth className="h-12 text-base rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all">
                  {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
                </Button>

                <div className="relative flex items-center justify-center my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                  <span className="relative bg-white px-3 text-xs text-gray-500 uppercase font-medium">Or continue with</span>
                </div>

                <GoogleButton />
                
                <p className="text-center text-sm text-gray-600 mt-6">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => setMode('register')} className="text-brand-blue font-bold hover:underline">
                    Sign Up
                  </button>
                </p>
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 uppercase">Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-gray-700 uppercase">Mobile</label>
                     <input 
                      type="tel" 
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                      placeholder="077..."
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase">Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                    placeholder="student@example.com"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                    placeholder="Min 6 chars"
                    required
                  />
                </div>

                <Button type="submit" fullWidth className="h-12 mt-2 rounded-xl bg-gradient-to-r from-brand-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/20">
                  {loading ? <Loader2 className="animate-spin" /> : "Create Account"}
                </Button>

                <p className="text-center text-sm text-gray-600 mt-4">
                  Already registered?{" "}
                  <button type="button" onClick={() => setMode('login')} className="text-brand-blue font-bold hover:underline">
                    Sign In
                  </button>
                </p>
              </form>
            )}

            {mode === 'forgot-password' && (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                    placeholder="Enter your registered email"
                    required
                  />
                </div>

                <Button type="submit" fullWidth className="h-12 rounded-xl">
                  {loading ? <Loader2 className="animate-spin" /> : "Send Reset Link"}
                </Button>

                <button 
                  type="button" 
                  onClick={() => setMode('login')}
                  className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium py-2"
                >
                  <ArrowLeft size={16} />
                  Back to Login
                </button>
              </form>
            )}

          </div>
          
          <p className="text-center text-xs text-slate-500 mt-8 font-medium">
            © 2024 SMART LABS PVT LTD. All rights reserved.
          </p>
        </div>
      </div>

      {/* Footer Credit */}
      <div className="absolute bottom-4 left-0 right-0 text-center z-30 pointer-events-none">
        <p className="text-[10px] md:text-xs text-slate-500/60 font-medium">
          Developed & Powered by <span className="text-slate-400/80 font-bold hover:text-brand-blue transition-colors cursor-pointer pointer-events-auto">ESystemLK</span>
        </p>
      </div>
    </div>
  );
}