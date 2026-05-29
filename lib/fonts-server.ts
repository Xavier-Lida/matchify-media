import "server-only";

import { GlobalFonts } from "@napi-rs/canvas";
import type { FontDefinition } from "@/lib/fonts";

const registeredUrls = new Set<string>();

async function fetchFontBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function registerFontUrl(url: string, family: string): Promise<void> {
  const key = `${family}::${url}`;
  if (registeredUrls.has(key)) return;

  const buffer = await fetchFontBuffer(url);
  if (!buffer) return;

  GlobalFonts.register(buffer, family);
  registeredUrls.add(key);
}

/**
 * Enregistre les polices custom pour @napi-rs/canvas (idempotent par URL).
 * Regular et bold partagent le même alias famille pour ctx.font "bold … family".
 */
export async function ensureFontsRegistered(
  fonts: FontDefinition[],
): Promise<void> {
  for (const font of fonts) {
    await registerFontUrl(font.regular_url, font.name);
    if (font.bold_url && font.bold_url !== font.regular_url) {
      await registerFontUrl(font.bold_url, font.name);
    }
  }
}
