"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Currency = "LKR" | "USD";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceLKR?: number, priceUSD?: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("LKR");

  useEffect(() => {
    // Load from local storage on mount
    const savedCurrency = localStorage.getItem("app-currency") as Currency;
    if (savedCurrency && (savedCurrency === "LKR" || savedCurrency === "USD")) {
      setCurrencyState(savedCurrency);
    }
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("app-currency", newCurrency);
  };

  const formatPrice = (priceLKR?: number, priceUSD?: number) => {
    if (currency === "USD") {
      if (priceUSD !== undefined && priceUSD !== null) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(priceUSD);
      }
      // Fallback: Convert LKR to USD (approximate rate if USD not set, but better to show unavailable or LKR)
      // For now, if USD is missing, we show LKR or specific placeholder
      // User requirement implies both should be added, so if one is missing, it might be free or error.
      // Let's fallback to LKR if USD is missing but LKR exists, maybe with a note, or just show LKR.
      // Ideally, we just return "N/A" if the specific currency price isn't available.
      if (priceLKR !== undefined && priceLKR !== null) {
         // Fallback logic: simplistic conversion or just show LKR value?
         // Let's just show LKR with LKR symbol if USD is missing to avoid confusion
         return new Intl.NumberFormat("en-LK", {
          style: "currency",
          currency: "LKR",
        }).format(priceLKR);
      }
    } else {
      // LKR
      if (priceLKR !== undefined && priceLKR !== null) {
        return new Intl.NumberFormat("en-LK", {
          style: "currency",
          currency: "LKR",
        }).format(priceLKR);
      }
       // Fallback to existing 'price' field if priceLKR is missing (backward compatibility)
       // This logic will be handled by passing the correct value to this function.
    }
    return "Free";
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
