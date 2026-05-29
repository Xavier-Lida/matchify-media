"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/admin";
  const forbidden = searchParams.get("error") === "forbidden";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    forbidden
      ? "Ce compte n'est pas autorisé à accéder à l'administration."
      : null,
  );
  const [loading, setLoading] = useState(false);

  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!forbidden) return;
    void createClient().auth.signOut();
  }, [forbidden]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError("Identifiants invalides.");
      return;
    }
    router.replace(redirectTo);
    router.refresh();
  };

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-surface p-6">
        <div>
          <h1 className="text-xl font-bold">Connexion admin</h1>
          <p className="mt-1 text-sm text-muted">
            Accès réservé à l&apos;administrateur.
          </p>
        </div>

        {!configured ? (
          <p className="rounded-lg border border-border bg-surface-2 p-3 text-sm text-muted">
            Supabase n&apos;est pas configuré. Voir <code>.env.example</code>.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="password">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
