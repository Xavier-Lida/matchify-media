"use client";

import { useEffect, useState } from "react";
import {
  mergeFontFamilyNames,
  SYSTEM_FONTS,
  type FontDefinition,
} from "@/lib/fonts";
import { loadFontFaces } from "@/lib/fonts-client";

export function useAvailableFonts() {
  const [fonts, setFonts] = useState<FontDefinition[]>([]);
  const [names, setNames] = useState<string[]>([...SYSTEM_FONTS]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/fonts");
        const data = (await res.json()) as { fonts?: FontDefinition[] };
        const list = data.fonts ?? [];
        if (cancelled) return;
        setFonts(list);
        setNames(mergeFontFamilyNames(list));
        await loadFontFaces(list);
      } catch {
        if (!cancelled) setNames([...SYSTEM_FONTS]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { fonts, names, loading };
}
