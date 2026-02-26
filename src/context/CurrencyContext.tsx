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
    setCurrencyState("LKR");
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    // Force LKR across the app
    setCurrencyState("LKR");
    try {
      localStorage.setItem("app-currency", "LKR");
    } catch {}
  };

  const formatPrice = (priceLKR?: number, priceUSD?: number) => {
    if (priceLKR !== undefined && priceLKR !== null) {
      return new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency: "LKR",
      }).format(priceLKR);
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
