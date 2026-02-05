"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

import { UserData } from "@/lib/types";
import { deleteField } from "firebase/firestore";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isCompact: boolean;
  customTheme?: NonNullable<UserData['preferences']>['customTheme'];
  updateTheme: (theme: NonNullable<NonNullable<UserData['preferences']>['customTheme']>) => Promise<void>;
  resetTheme: () => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const { userData } = useAuth();

  // Load from local storage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(storageKey) as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, [storageKey]);

  // Sync with user preferences if logged in
  useEffect(() => {
    if (userData?.preferences?.darkMode !== undefined) {
      const userTheme = userData.preferences.darkMode ? "dark" : "light";
      if (userTheme !== theme) {
        setThemeState(userTheme);
      }
    }
  }, [userData]);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);

    // Persist to Firestore if user is logged in
    if (userData) {
      try {
        const userRef = doc(db, "users", userData.uid);
        await updateDoc(userRef, {
          "preferences.darkMode": newTheme === "dark"
        });
      } catch (error) {
        console.error("Failed to save theme preference:", error);
      }
    }
  };

  const isCompact = userData?.preferences?.compactMode ?? false;
  const customTheme = userData?.preferences?.customTheme;
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const updateTheme = async (newTheme: NonNullable<NonNullable<UserData['preferences']>['customTheme']>) => {
    if (!userData) return;
    try {
      const userRef = doc(db, "users", userData.uid);
      await updateDoc(userRef, {
        "preferences.customTheme": newTheme
      });
    } catch (error) {
      console.error("Failed to update custom theme:", error);
    }
  };

  const resetTheme = async () => {
    if (!userData) return;
    try {
      const userRef = doc(db, "users", userData.uid);
      await updateDoc(userRef, {
        "preferences.customTheme": deleteField()
      });
    } catch (error) {
      console.error("Failed to reset theme:", error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isCompact, customTheme, updateTheme, resetTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
