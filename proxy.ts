import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Proxy Next.js 16 — délègue à updateSession (pattern Supabase SSR actuel).
 * @see lib/supabase/proxy.ts
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Toutes les routes sauf assets statiques — le refresh de session doit
     * tourner partout où l'utilisateur peut être connecté (pas seulement /admin).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
