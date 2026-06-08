"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import type { FontDefinition } from "@/lib/fonts";

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent";

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function FontsManager() {
  const [fonts, setFonts] = useState<FontDefinition[]>([]);
  const [name, setName] = useState("");
  const [regularFile, setRegularFile] = useState<File | null>(null);
  const [boldFile, setBoldFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    const res = await fetch("/api/fonts");
    const data = (await res.json()) as { fonts?: FontDefinition[] };
    setFonts(data.fonts ?? []);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/fonts");
      const data = (await res.json()) as { fonts?: FontDefinition[] };
      if (!cancelled) setFonts(data.fonts ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isSupabaseConfigured()) {
    return (
      <p className="text-sm text-muted">
        Supabase non configuré. Voir <code>.env.example</code>.
      </p>
    );
  }

  const uploadFontFile = async (file: File, suffix: string) => {
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "woff2";
    const path = `${slugify(name) || "font"}-${suffix}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("fonts")
      .upload(path, file, {
        contentType: file.type || "font/woff2",
        upsert: false,
      });
    if (uploadError) throw uploadError;
    return supabase.storage.from("fonts").getPublicUrl(path).data.publicUrl;
  };

  const addFont = async () => {
    if (!name.trim() || !regularFile) {
      setError("Nom et fichier regular requis.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const regular_url = await uploadFontFile(regularFile, "regular");
      let bold_url: string | null = null;
      if (boldFile) {
        bold_url = await uploadFontFile(boldFile, "bold");
      }

      const { error: insertError } = await supabase.from("fonts").insert({
        name: name.trim(),
        regular_url,
        bold_url,
      });
      if (insertError) throw insertError;

      setName("");
      setRegularFile(null);
      setBoldFile(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout.");
    } finally {
      setBusy(false);
    }
  };

  const removeFont = async (id: string) => {
    if (!confirm("Supprimer cette police ?")) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("fonts").delete().eq("id", id);
      if (error) throw error;
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la suppression.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="max-w-lg space-y-4 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">Ajouter une police</h2>
        <div className="space-y-1">
          <label className="text-sm font-medium">Nom (fontFamily)</label>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex: Ma Police"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Fichier regular (.woff2, .ttf)</label>
          <input
            type="file"
            accept=".woff2,.woff,.ttf,.otf"
            className="text-sm"
            onChange={(e) => setRegularFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Fichier bold (optionnel)</label>
          <input
            type="file"
            accept=".woff2,.woff,.ttf,.otf"
            className="text-sm"
            onChange={(e) => setBoldFile(e.target.files?.[0] ?? null)}
          />
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="button"
          disabled={busy}
          onClick={addFont}
          className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
        >
          {busy ? "Enregistrement…" : "Ajouter"}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-2 text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Bold</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fonts.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted">
                  Aucune police custom. Arial reste disponible par défaut.
                </td>
              </tr>
            ) : (
              fonts.map((f) => (
                <tr key={f.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{f.name}</td>
                  <td className="px-4 py-3 text-muted">
                    {f.bold_url ? "oui" : "non (gras = regular)"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeFont(f.id)}
                      className="text-xs text-muted hover:text-red-400"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
