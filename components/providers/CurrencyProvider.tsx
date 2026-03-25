"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  rates: Record<string, number>;
  supportedCountries: any[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState("INR");
  const [rates, setRates] = useState<Record<string, number>>({ "INR": 1 });
  const [supportedCountries, setSupportedCountries] = useState<any[]>([]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        const settings = await res.json();
        const localization = settings?.localization;
        if (localization) {
          setRates(localization.rates || { "INR": 1 });
          const active = localization.supportedCountries?.filter((c: any) => c.active) || [];
          setSupportedCountries(active);
          
          // Load preferred currency from localStorage or default to INR
          const saved = localStorage.getItem("preferred_currency");
          if (saved) {
            setCurrency(saved);
          } else if (active.length > 0) {
            // Optional: detect by locale or just keep INR as default
          }
        }
      } catch (err) {
        console.error("Failed to load currency settings", err);
      }
    };
    loadSettings();
  }, []);

  const changeCurrency = (curr: string) => {
    setCurrency(curr);
    localStorage.setItem("preferred_currency", curr);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: changeCurrency, rates, supportedCountries }}>
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

export function Price({ amount, className }: { amount: number, className?: string }) {
  const { currency, rates } = useCurrency();
  
  // Calculate converted price
  // amount is always assumed to be in base currency (INR)
  const rate = rates[currency] || 1;
  const converted = amount * rate;
  
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return <span className={className}>{formatter.format(converted)}</span>;
}
