"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import { useBranding } from "@/hooks/useBranding";
import type { Branding } from "@/lib/templates/types";

type BrandingContextValue = {
  branding: Branding;
  setBranding: (branding: Branding) => void;
  updateBranding: (patch: Partial<Branding>) => void;
  hydrated: boolean;
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const value = useBranding();

  return (
    <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>
  );
}

export function useBrandingContext() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBrandingContext must be used within BrandingProvider");
  }
  return context;
}
