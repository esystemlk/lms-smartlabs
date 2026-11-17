"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  getRedirectResult,
  GoogleAuthProvider,
  User
} from "firebase/auth";
import { doc, getDoc, getDocFromServer, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, Lock, Globe } from "lucide-react";
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

  // Handle Google redirect result
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (mounted && result && result.user) {
          await processAuthUser(result.user);
        }
      } catch (err: any) {
        if (mounted) {
          setError("Failed to sign in with Google.");
          setLoading(false);
        }
      }
    };
    run();
    return () => { mounted = false; };
  }, []);
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
        // Fetch global settings to check for authorized developer emails
        let developerEmails = ["tikfese@gmail.com", "thimira.vishwa2003@gmail.com"];
        try {
          const settingsSnap = await getDoc(doc(db, "settings", "global"));
          if (settingsSnap.exists() && settingsSnap.data().developerEmails) {
            developerEmails = [...developerEmails, ...settingsSnap.data().developerEmails];
          }
        } catch (e) {
          console.error("Failed to fetch settings during signup check", e);
        }

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
      try {
        const result = await signInWithPopup(auth, provider);
        await processAuthUser(result.user);
      } catch (popupErr: any) {
        const fallback = await import("firebase/auth");
        await fallback.signInWithRedirect(auth, provider as any);
      }
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
          <div className="w-5 h-5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.651 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.153 7.963 3.037l5.657-5.657C34.046 7.159 29.268 5 24 5 12.955 5 4 13.955 4 25s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.153 7.963 3.037l5.657-5.657C34.046 7.159 29.268 5 24 5 16.318 5 9.75 9.213 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 45c5.123 0 9.835-1.957 13.409-5.146l-6.19-5.236C29.19 36.52 26.715 37.5 24 37.5c-5.2 0-9.616-3.329-11.276-7.965l-6.53 5.026C9.62 40.789 16.302 45 24 45z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.79 2.229-2.231 4.139-4.093 5.5l.003-.002 6.19 5.236C35.085 41.63 39 34.5 39 25c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
          </div>
          <span className="group-hover:text-gray-900">Continue with Google</span>
        </>
      )}
    </button>
  );

  return (
    <div className="min-h-screen w-full bg-background grid lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel: full height on desktop, a short header on phones */}
      <section className="relative overflow-hidden sl-hero text-white lg:m-4 lg:rounded-[32px] rounded-b-[32px] px-6 pt-8 pb-20 lg:p-11 flex flex-col justify-between gap-8">
        <span aria-hidden className="sl-float absolute -right-28 -top-28 w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(158,176,255,.7),transparent_70%)]" />
        <span aria-hidden className="sl-float absolute -left-20 -bottom-24 w-[320px] h-[320px] rounded-full bg-[radial-gradient(circle,rgba(255,150,70,.55),transparent_70%)]" style={{ animationDelay: "-4s" }} />
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white relative overflow-hidden">
            <Image src="/logo.png" alt="" fill className="object-contain p-1" priority />
          </div>
          <span className="font-display font-bold text-xl">SMART LABS</span>
        </div>
        <div className="relative flex flex-col gap-4 max-w-xl">
          <h1 className="sl-rise text-[28px] lg:text-[44px] font-extrabold leading-[1.1]">
            Learn live. Catch up anytime. Track every step.
          </h1>
          <p className="sl-rise hidden lg:block text-[#DCE2FF] text-base max-w-md" style={{ animationDelay: ".08s" }}>
            IELTS, PTE and English classes with live sessions, recordings and progress — on any device.
          </p>
          {/* Illustrations generated with ChatGPT, saved in /public/login */}
          <div className="hidden lg:flex items-end gap-5 mt-4">
            <div className="sl-rise sl-float w-[46%] max-w-[260px] aspect-square relative rounded-[28px] overflow-hidden border-4 border-white/30 shadow-[0_20px_40px_rgba(15,23,42,.25)] -rotate-3" style={{ animationDelay: ".16s" }}>
              <Image src="/login/live-class.png" alt="Student joining a live online class on a laptop" fill sizes="260px" className="object-cover" priority />
            </div>
            <div className="sl-rise sl-float w-[46%] max-w-[260px] aspect-square relative rounded-[28px] overflow-hidden border-4 border-white/30 shadow-[0_20px_40px_rgba(15,23,42,.25)] rotate-3 mb-10" style={{ animationDelay: "-3s" }}>
              <Image src="/login/recordings.png" alt="Student watching a class recording on a tablet" fill sizes="260px" className="object-cover" />
            </div>
          </div>
        </div>
        <p className="relative hidden lg:block text-[13px] text-[#DCE2FF]">© SMART LABS · Developed &amp; powered by ESystemLK</p>
      </section>

      {/* Form */}
      <div className="flex items-start lg:items-center justify-center px-4 pb-10 -mt-12 lg:mt-0 lg:py-10 relative z-10">
        <div className="w-full max-w-[420px] sl-rise" style={{ animationDelay: ".05s" }}>
          <div className="bg-white rounded-[26px] border border-line shadow-[0_16px_40px_rgba(15,23,42,.1)] lg:shadow-none lg:border-0 lg:bg-transparent p-6 sm:p-8 lg:p-0">

            <div className="mb-6">
              <h3 className="text-[28px] font-extrabold text-ink">
                {mode === 'login' && "Welcome Back"}
                {mode === 'register' && "Create Account"}
                {mode === 'forgot-password' && "Reset Password"}
              </h3>
              <p className="text-[15px] text-ink-muted mt-1">
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
              <form onSubmit={handleLogin} className="space-y-4 md:space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 h-12 bg-white border border-line rounded-[14px] focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-sm font-medium"
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
                      className="w-full pl-10 pr-10 h-12 bg-white border border-line rounded-[14px] focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-sm font-medium"
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

                <Button type="submit" fullWidth className="h-11 md:h-12 text-base rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all">
                  {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
                </Button>

                <div className="relative flex items-center justify-center my-4 md:my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                  <span className="relative bg-white lg:bg-background px-3 text-[10px] md:text-xs text-gray-500 uppercase font-medium">Or continue with</span>
                </div>

                <GoogleButton />
                
                <p className="text-center text-sm text-gray-600 mt-4 md:mt-6">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => setMode('register')} className="text-brand-blue font-bold hover:underline">
                    Sign Up
                  </button>
                </p>
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-semibold text-gray-700 uppercase">Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 h-12 bg-white border border-line rounded-[14px] focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] md:text-xs font-semibold text-gray-700 uppercase">Mobile</label>
                     <input 
                      type="tel" 
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full px-4 h-12 bg-white border border-line rounded-[14px] focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
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
                    className="w-full px-4 h-12 bg-white border border-line rounded-[14px] focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
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
                    className="w-full px-4 h-12 bg-white border border-line rounded-[14px] focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
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
                    className="w-full px-4 h-12 bg-white border border-line rounded-[14px] focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
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
          
          <p className="lg:hidden text-center text-xs text-ink-muted mt-6">
            © SMART LABS · Developed &amp; powered by ESystemLK
          </p>
        </div>
      </div>
    </div>
  );
}
