"use client";

import { useState } from "react";
import type { SpordleMatchData } from "@/lib/spordle-types";

export function SpordleImport({
  onImport,
}: {
  onImport: (data: SpordleMatchData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/spordle?url=${encodeURIComponent(url)}`);
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Échec de l'import Spordle.");
        return;
      }
      onImport(body as SpordleMatchData);
      setOpen(false);
      setUrl("");
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-medium hover:border-accent"
      >
        Importer depuis Spordle
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md space-y-4 rounded-lg border border-border bg-surface p-5">
            <h3 className="text-lg font-semibold">Importer depuis Spordle</h3>
            <p className="text-sm text-muted">
              Collez l&apos;URL de la page du match sur Spordle.
            </p>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…spordle.com/…"
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
            />
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2 text-sm text-muted hover:text-foreground"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={loading || !url}
                className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
              >
                {loading ? "Import…" : "Importer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
