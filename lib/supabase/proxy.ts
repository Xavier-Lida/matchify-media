import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  isAdminEmail,
  isSupabaseConfigured,
} from "@/lib/env";

/**
 * Rafraîchit la session Auth et applique la protection /admin.
 * Pattern officiel Supabase SSR (getClaims + cache headers sur setAll).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return supabaseResponse;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  // Rafraîchit le JWT et valide la signature (recommandé vs getSession/getUser seul).
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const isAuthenticated = Boolean(claims?.sub);
  const email =
    typeof claims?.email === "string" ? claims.email : undefined;
  const isAdmin = isAuthenticated && isAdminEmail(email);

  const { pathname } = request.nextUrl;
  const isAdminArea = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";

  if (isAdminArea && !isLoginPage) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!isAdmin) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("error", "forbidden");
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isLoginPage && isAdmin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return supabaseResponse;
}
