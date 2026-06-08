import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";
import { PhosphorIcon } from "@/components/ui/PhosphorIcon";

export async function SiteHeader() {
  const user = isSupabaseConfigured() ? await getSessionUser() : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <nav className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="shrink-0 origin-left text-xl font-medium tracking-tight text-primary transition-transform duration-200 hover:scale-[1.02]"
        >
          Matchify Media
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/templates"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <PhosphorIcon name="layout" />
            <span className="hidden sm:inline">Templates</span>
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <PhosphorIcon name="folder-simple" />
              <span className="hidden sm:inline">Mes projets</span>
            </Link>
          ) : null}
          {user ? (
            <form action="/logout" method="post" className="inline">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <PhosphorIcon name="sign-out" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <PhosphorIcon name="sign-in" />
              <span className="hidden sm:inline">Connexion</span>
            </Link>
          )}
          {!user ? (
            <Link
              href="/signup"
              className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors"
            >
              S&apos;inscrire
            </Link>
          ) : null}
          {user?.isAdmin ? (
            <Link
              href="/admin"
              className="ml-1 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              <PhosphorIcon name="shield" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
