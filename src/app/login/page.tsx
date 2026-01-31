"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  User,
  AuthError
} from "firebase/auth";
import { doc, getDoc, getDocFromServer, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { countries } from "@/data/countries";

type AuthMode = "login" | "register" | "forgot-password";

export default function LoginPage() {
  const router = useRouter();
  const { user: authUser, userData, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Register/Profile specific states
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState("male");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Handle existing session and automatic redirection
  useEffect(() => {
    if (authLoading) return;

    if (authUser) {
      // Always redirect to dashboard if authenticated
      // The dashboard will handle missing profile data notifications
      router.push("/dashboard");
    }
  }, [authUser, authLoading, router]);

  // Process user after successful authentication
  const processAuthUser = async (user: User) => {
    setLoading(true);
    try {
      // Check if user profile exists in Firestore (force server fetch to avoid stale cache)
      // This prevents "No document to update" errors if account was deleted on server but exists in cache
      let userDoc;
      try {
        userDoc = await getDocFromServer(doc(db, "users", user.uid));
      } catch (e) {
        // Fallback to cache if server fetch fails (e.g. offline)
        console.warn("Failed to fetch user from server, falling back to cache", e);
        userDoc = await getDoc(doc(db, "users", user.uid));
      }

      if (userDoc.exists()) {
        // User exists -> Redirect to Dashboard directly
        router.push("/dashboard");
      } else {
        // New user (no document) -> Create basic profile and redirect
        const developerEmails = [
          "tikfese@gmail.com",
          "thimira.vishwa2003@gmail.com"
        ];
        
        const role = developerEmails.includes(user.email || "") ? "developer" : "student";
        
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: user.displayName || "",
          email: user.email || "",
          role,
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



  const resetForm = () => {
    setError("");
    setSuccessMessage("");
    setEmail("");
    setPassword("");
    setName("");
    setContact("");
    setCountry("");
    setGender("male");
    setConfirmPassword("");
    setGoogleUser(null);
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      // Use signInWithPopup for better reliability
      const result = await signInWithPopup(auth, provider);
      await processAuthUser(result.user);
    } catch (err: any) {
      console.error(err);
      setError("Failed to sign in with Google. Please try again.");
      setLoading(false);
    }
  };





  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!country) {
      setError("Please select a country");
      setLoading(false);
      return;
    }

    try {
      // 1. Create Authentication User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Update Profile Display Name
      await updateProfile(user, {
        displayName: name
      });

      // 3. Save User Details to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        contact,
        country,
        gender,
        role: "student",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        authProvider: "email"
      });

      // 4. Redirect
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Email is already registered. Please login instead.");
      } else {
        setError(err.message || "Failed to register. Please try again.");
      }
    } finally {
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
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError("No account found with this email.");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const GoogleButton = () => (
    <Button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      variant="outline"
      fullWidth
      className="mb-6 flex items-center justify-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      Sign in with Google
    </Button>
  );

  return (
    <div className="min-h-screen w-full flex bg-white relative">
      {/* Left Panel - Desktop Only */}
      <div className="hidden md:flex w-1/2 lg:w-3/5 relative overflow-hidden flex-col justify-between p-12 bg-white">
        {/* Education/Tech Image - Full Opacity */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/lg.png"
            alt="Background"
            fill
            className="object-contain p-8"
            priority
          />
        </div>
        
        {/* Top Spacer */}
        <div className="relative z-20"></div>

        {/* Bottom Text Content */}
        <div className="relative z-20 mt-auto">
          <div className="text-[12px] text-brand-blue font-bold font-footer uppercase tracking-widest leading-loose">
            <p className="mb-1">Developed & powered by ESystemLK</p>
            <p>© SMART LABS PVT LTD. All rights reserved</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 bg-white overflow-y-auto max-h-screen">
        <div className="max-w-md w-full mx-auto">
          {/* Logo - Visible on All Screens */}
          <div className="mb-8 text-center flex justify-center">
            <div className="relative w-48 h-20 md:w-56 md:h-24">
              <Image 
                src="/logo.png" 
                alt="SMART LABS" 
                fill 
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {mode === 'login' && "𝒲𝑒𝓁𝒸𝑜𝓂𝑒 𝓉𝑜 𝒮𝑀𝒜𝑅𝒯 𝐿𝒜𝐵𝒮"}
              {mode === 'register' && "Create Account"}
              {mode === 'forgot-password' && "Reset Password"}
            </h2>
            <p className="text-gray-500">
              {mode === 'login' && "Learn English Smarter"}
              {mode === 'register' && "Join our learning community"}
              {mode === 'forgot-password' && "Enter your email to reset password"}
            </p>
          </div>

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <GoogleButton />
              
              <div className="relative flex items-center justify-center text-sm mb-6">
                <span className="bg-white px-2 text-gray-500">Or continue with email</span>
                <div className="absolute inset-0 flex items-center -z-10">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
              </div>

              <Input
                label="Email Address"
                type="email"
                placeholder="student@smartlabs.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  icon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="focus:outline-none hover:text-brand-blue transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  }
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleModeChange('forgot-password')}
                  className="text-sm font-medium text-brand-blue hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                fullWidth
                disabled={loading}
                className="mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>

              <div className="mt-6 text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleModeChange('register')}
                  className="font-medium text-brand-blue hover:text-blue-700 transition-colors"
                >
                  Sign up
                </button>
              </div>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <GoogleButton />

              <div className="relative flex items-center justify-center text-sm mb-6">
                <span className="bg-white px-2 text-gray-500">Or sign up with email</span>
                <div className="absolute inset-0 flex items-center -z-10">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
              </div>

              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="student@smartlabs.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Contact No / WhatsApp"
                type="tel"
                placeholder="+94 77 123 4567"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>Select your country</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Gender</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={gender === "male"}
                      onChange={(e) => setGender(e.target.value)}
                      className="text-brand-blue focus:ring-brand-blue"
                    />
                    <span className="text-sm text-gray-700">Male</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={gender === "female"}
                      onChange={(e) => setGender(e.target.value)}
                      className="text-brand-blue focus:ring-brand-blue"
                    />
                    <span className="text-sm text-gray-700">Female</span>
                  </label>
                </div>
              </div>

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  icon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="focus:outline-none hover:text-brand-blue transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  }
                />
              </div>

              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  icon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="focus:outline-none hover:text-brand-blue transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  }
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                fullWidth
                disabled={loading}
                className="mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </Button>

              <div className="mt-6 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="font-medium text-brand-blue hover:text-blue-700 transition-colors"
                >
                  Login
                </button>
              </div>
            </form>
          )}



          {/* Forgot Password Form */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                placeholder="student@smartlabs.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm">
                  {successMessage}
                </div>
              )}

              <Button
                type="submit"
                fullWidth
                disabled={loading}
                className="mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="mt-6 text-center text-sm">
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="flex items-center justify-center gap-2 mx-auto font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to Login
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center md:hidden">
            <p className="text-xs text-gray-400">
              © SMART LABS PVT LTD. All rights reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
