"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Cloud, Moon, Sun, CloudRain, Wind } from "lucide-react";

export function GreetingWidget() {
  const { userData } = useAuth();
  const [greeting, setGreeting] = useState("");
  const [icon, setIcon] = useState<React.ReactNode>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    
    if (hour < 12) {
      setGreeting("Good Morning");
      setIcon(<Sun className="w-12 h-12 text-yellow-400 animate-spin-slow" />);
    } else if (hour < 18) {
      setGreeting("Good Afternoon");
      setIcon(<Cloud className="w-12 h-12 text-blue-400 animate-bounce-slow" />);
    } else {
      setGreeting("Good Evening");
      setIcon(<Moon className="w-12 h-12 text-indigo-400 animate-pulse" />);
    }
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 md:p-6 text-white shadow-lg overflow-hidden relative">
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-3xl font-bold mb-1 flex items-center gap-2 md:gap-3">
            {greeting}, {userData?.name?.split(" ")[0]}!
          </h2>
          <p className="text-blue-100 text-sm md:text-base font-medium opacity-90">
            Ready to continue your learning journey?
          </p>
        </div>
        <div className="block md:hidden opacity-90">
             {/* Mobile Icon */}
             <div className="transform scale-75 origin-right">
                {icon}
             </div>
        </div>
        <div className="hidden md:block opacity-90 transform scale-125">
          {icon}
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-blue-400 opacity-20 rounded-full blur-3xl"></div>
    </div>
  );
}
