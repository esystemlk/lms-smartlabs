"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

interface CustomTheme {
  primary: string;
  background: string;
  foreground: string;
  card: string;
  sidebar: string;
}

const DEFAULT_THEME: CustomTheme = {
  primary: "#0056D2",
  background: "#ffffff",
  foreground: "#1a1a1a",
  card: "#ffffff",
  sidebar: "#ffffff",
};

const DEFAULT_DARK_THEME: CustomTheme = {
  primary: "#3b82f6",
  background: "#0f172a",
  foreground: "#f8fafc",
  card: "#1e293b",
  sidebar: "#1e293b",
};

interface ThemeContextType {
  isCompact: boolean;
  isDark: boolean;
  customTheme: CustomTheme;
  updateTheme: (newTheme: Partial<CustomTheme>) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isCompact: false,
  isDark: false,
  customTheme: DEFAULT_THEME,
  updateTheme: () => { },
  resetTheme: () => { },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { userData } = useAuth();

  // Default to false if preferences are missing
  const isDark = userData?.preferences?.darkMode ?? false;
  const isCompact = userData?.preferences?.compactMode ?? false;

  // Load custom theme from user preferences or fallback to defaults
  const [customTheme, setCustomTheme] = useState<CustomTheme>(DEFAULT_THEME);

  useEffect(() => {
    if (userData?.preferences?.customTheme) {
      setCustomTheme({ ...DEFAULT_THEME, ...userData.preferences.customTheme });
    } else {
      setCustomTheme(isDark ? DEFAULT_DARK_THEME : DEFAULT_THEME);
    }
  }, [userData, isDark]);

  useEffect(() => {
    // Apply custom CSS variables
    const root = document.documentElement;
    root.style.setProperty("--brand-blue", customTheme.primary);
    root.style.setProperty("--background", customTheme.background);
    root.style.setProperty("--foreground", customTheme.foreground);
    root.style.setProperty("--card-bg", customTheme.card);
    // Add more variables as needed
  }, [customTheme]);

  useEffect(() => {
    // Handle Dark Mode class
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    // Handle Compact Mode class
    if (isCompact) {
      document.body.classList.add("compact");
    } else {
      document.body.classList.remove("compact");
    }
  }, [isCompact]);

  const updateTheme = (newTheme: Partial<CustomTheme>) => {
    setCustomTheme(prev => {
      const updated = { ...prev, ...newTheme };
      // Here you would typically also save to Firebase
      return updated;
    });
  };

  const resetTheme = () => {
    const defaultTheme = isDark ? DEFAULT_DARK_THEME : DEFAULT_THEME;
    setCustomTheme(defaultTheme);
    // Also reset in Firebase if needed
  };

  return (
    <ThemeContext.Provider value={{ isCompact, isDark, customTheme, updateTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
