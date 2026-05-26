"use client";

import { useCallback, useEffect, useState } from "react";

import { BRANDING_STORAGE_KEY } from "@/lib/constants";
import {
  DEFAULT_BRANDING,
  type Branding,
} from "@/lib/templates/types";

function readBranding(): Branding {
  if (typeof window === "undefined") {
    return DEFAULT_BRANDING;
  }

  const raw = localStorage.getItem(BRANDING_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_BRANDING;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Branding>;
    return {
      leagueName: parsed.leagueName ?? DEFAULT_BRANDING.leagueName,
      primaryColor: parsed.primaryColor ?? DEFAULT_BRANDING.primaryColor,
      secondaryColor: parsed.secondaryColor ?? DEFAULT_BRANDING.secondaryColor,
      logoDataUrl: parsed.logoDataUrl ?? null,
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}

export function useBranding() {
  const [branding, setBrandingState] = useState<Branding>(DEFAULT_BRANDING);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setBrandingState(readBranding());
    setHydrated(true);
  }, []);

  const setBranding = useCallback((next: Branding) => {
    setBrandingState(next);
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const updateBranding = useCallback((patch: Partial<Branding>) => {
    setBrandingState((current) => {
      const next = { ...current, ...patch };
      localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { branding, setBranding, updateBranding, hydrated };
}
