import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  let email: string | undefined;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const claimEmail = claimsData?.claims?.email;
    email = typeof claimEmail === "string" ? claimEmail : undefined;
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard admin</h1>
            {email ? (
              <p className="mt-1 text-sm text-muted">Connecté : {email}</p>
            ) : null}
          </div>
          <LogoutButton />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/templates"
            className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/60"
          >
            <h2 className="font-semibold">Gérer les templates</h2>
            <p className="mt-1 text-sm text-muted">
              Activer, désactiver ou supprimer les templates existants.
            </p>
          </Link>
          <Link
            href="/admin/templates/new"
            className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/60"
          >
            <h2 className="font-semibold">Créer un template</h2>
            <p className="mt-1 text-sm text-muted">
              Importer un PNG de fond et définir les champs.
            </p>
          </Link>
          <Link
            href="/admin/fonts"
            className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/60"
          >
            <h2 className="font-semibold">Gérer les polices</h2>
            <p className="mt-1 text-sm text-muted">
              Ajouter ou supprimer des polices (.woff2, .ttf).
            </p>
          </Link>
        </div>
      </main>
    </>
  );
}
