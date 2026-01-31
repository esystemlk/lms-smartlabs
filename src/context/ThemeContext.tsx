"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

interface ThemeContextType {
  isCompact: boolean;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  isCompact: false,
  isDark: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { userData } = useAuth();
  
  // Default to false if preferences are missing
  const isDark = userData?.preferences?.darkMode ?? false;
  const isCompact = userData?.preferences?.compactMode ?? false;

  useEffect(() => {
    // Handle Dark Mode
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    // Handle Compact Mode
    // We add a class to body so we can use global CSS overrides if needed
    if (isCompact) {
      document.body.classList.add("compact");
    } else {
      document.body.classList.remove("compact");
    }
  }, [isCompact]);

  return (
    <ThemeContext.Provider value={{ isCompact, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
