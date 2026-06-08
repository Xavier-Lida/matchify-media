"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

type Mode = "login" | "signup";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors";

export function AuthForm({
  mode,
  redirectTo = "/dashboard",
}: {
  mode: Mode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName || undefined },
        },
      });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      router.replace(redirectTo);
      router.refresh();
      return;
    }

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

  const title = mode === "login" ? "Connexion" : "Créer un compte";
  const alternate =
    mode === "login"
      ? { href: "/signup", label: "Pas encore de compte ? S'inscrire" }
      : { href: "/login", label: "Déjà un compte ? Se connecter" };

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-surface p-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Accédez à vos projets et exportez vos visuels.
          </p>
        </div>

        {!configured ? (
          <p className="rounded-md border border-border bg-surface-2 p-3 text-sm text-muted">
            Supabase n&apos;est pas configuré. Voir <code>.env.example</code>.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" ? (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="displayName">
                  Nom affiché
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputClass}
                />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                Courriel
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
            >
              {loading
                ? "Chargement…"
                : mode === "login"
                  ? "Se connecter"
                  : "S'inscrire"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-muted">
          <Link href={alternate.href} className="text-primary hover:underline">
            {alternate.label}
          </Link>
        </p>
      </div>
    </main>
  );
}
