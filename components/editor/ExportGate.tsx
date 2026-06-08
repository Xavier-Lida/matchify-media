"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

export function ExportGate({
  children,
  loginHref = "/login",
}: {
  children: (props: { canExport: boolean; userId: string | null }) => ReactNode;
  loginHref?: string;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return <p className="text-sm text-muted">Vérification de la session…</p>;
  }

  const canExport = Boolean(userId);

  return (
    <div className="space-y-2">
      {children({ canExport, userId })}
      {!canExport ? (
        <p className="text-sm text-muted">
          <Link href={loginHref} className="text-accent font-medium hover:underline">
            Connectez-vous
          </Link>{" "}
          pour télécharger vos visuels.
        </p>
      ) : null}
    </div>
  );
}
