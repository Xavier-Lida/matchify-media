"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  buildTemplateData,
  initialHtmlFormValues,
  injectDataIntoHtml,
  parseHtmlSchema,
} from "@/lib/html-template";
import { useElementWidth } from "@/lib/hooks/use-element-width";
import {
  TEMPLATE_TYPES,
  TEMPLATE_TYPE_LABELS,
  type DataRequirement,
  type DataRequirementType,
  type HtmlSchema,
  type Template,
  type TemplateType,
} from "@/lib/types";

const REQUIREMENT_TYPE_LABELS: Record<DataRequirementType, string> = {
  last_match:   "Dernier match joué (auto)",
  next_match:   "Prochain match à venir (auto)",
  match_pick:   "Match au choix",
  results_pick: "Plusieurs matchs au choix (liste)",
  standings:    "Classement complet (auto)",
  team_pick:    "Équipe au choix",
  league:       "Données ligue — nom, logo, division (auto)",
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent";

function slugify(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function generatePreview(
  html: string,
  schema: HtmlSchema,
  defaultData: Record<string, unknown> | null,
  width: number,
  height: number,
): Promise<Blob | null> {
  try {
    const data = defaultData
      ? buildTemplateData(schema, initialHtmlFormValues(schema, defaultData))
      : buildTemplateData(schema, initialHtmlFormValues(schema));
    const injected = injectDataIntoHtml(html, data);
    const res = await fetch("/api/export-png", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html: injected, width, height }),
    });
    return res.ok ? await res.blob() : null;
  } catch {
    return null;
  }
}

export function HtmlTemplateEdit({ template }: { template: Template }) {
  const router = useRouter();
  const config = template.json_config;
  const canvasWidth = config.canvasWidth;
  const canvasHeight = config.canvasHeight;

  // ── Metadata ──
  const [nom, setNom] = useState(template.nom);
  const [type, setType] = useState<TemplateType>(template.type);
  const [description, setDescription] = useState(template.description ?? "");

  // ── Current state (fetched from Storage) ──
  const [currentHtml, setCurrentHtml] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);

  // ── Requirements ──
  const [requirements, setRequirements] = useState<DataRequirement[]>(
    config.requirements ?? [],
  );

  // ── New files (optional replacements) ──
  const [newHtml, setNewHtml] = useState<string | null>(null);
  const [newHtmlName, setNewHtmlName] = useState<string | null>(null);
  const [newSchema, setNewSchema] = useState<HtmlSchema | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // ── Default values (editable text/number fields) ──
  const editableDefaults = (newSchema ?? config.htmlSchema)?.sections.filter(
    (s) => (s.type === "text" || s.type === "number") && !s.requirementId,
  ) ?? [];
  const [defaultValues, setDefaultValues] = useState<Record<string, string>>(
    () => Object.fromEntries(
      editableDefaults.map((s) => [s.key, String((config.htmlDefaultData as Record<string, unknown> | undefined)?.[s.key] ?? "")]),
    ),
  );

  // ── Cover photo ──
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // ── Save ──
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Preview scaling ──
  const [wrapperRef, wrapperWidth] = useElementWidth();
  const scale = wrapperWidth > 0 ? wrapperWidth / canvasWidth : 0;

  // Active values (new overrides current)
  const activeHtml = newHtml ?? currentHtml;
  const activeSchema = newSchema ?? (config.htmlSchema ?? null);
  const activeDefaultData = config.htmlDefaultData ?? null;

  const previewSrcdoc = useMemo(() => {
    if (!activeHtml || !activeSchema) return null;
    const data = activeDefaultData
      ? buildTemplateData(activeSchema, initialHtmlFormValues(activeSchema, activeDefaultData))
      : buildTemplateData(activeSchema, initialHtmlFormValues(activeSchema));
    return injectDataIntoHtml(activeHtml, data);
  }, [activeHtml, activeSchema, activeDefaultData]);

  // Fetch current HTML from Storage on mount
  useEffect(() => {
    if (!config.htmlUrl) return;
    fetch(config.htmlUrl)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then(setCurrentHtml)
      .catch(() => setFetchError(true));
  }, [config.htmlUrl]);

  const onHtmlFile = useCallback((file: File) => {
    setNewHtmlName(file.name);
    setFileError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const html = (e.target?.result as string) ?? null;
      setNewHtml(html);
      // Re-parse schema from data-bind attributes in the new HTML
      if (html) setNewSchema(parseHtmlSchema(html));
    };
    reader.readAsText(file);
  }, []);

  const onCoverFile = useCallback((file: File) => {
    setCoverFile(file);
    const url = URL.createObjectURL(file);
    setCoverPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
  }, []);

  const save = async () => {
    if (!nom.trim()) return;
    setSaving(true);
    setSaveError(null);
    setSaveStatus("Sauvegarde…");

    try {
      const supabase = createClient();
      let htmlUrl = config.htmlUrl!;

      // Upload new HTML file if provided
      if (newHtml) {
        setSaveStatus("Upload du HTML…");
        const key = `html/${slugify(nom) || "template"}-${Date.now()}.html`;
        const { error: upErr } = await supabase.storage
          .from("templates")
          .upload(key, new Blob([newHtml], { type: "text/html" }), {
            contentType: "text/html",
            upsert: false,
          });
        if (upErr) throw upErr;
        htmlUrl = supabase.storage.from("templates").getPublicUrl(key).data.publicUrl;
      }

      const schema = activeSchema ?? config.htmlSchema;

      // Update template row
      setSaveStatus("Mise à jour…");
      const { error: updateErr } = await supabase
        .from("templates")
        .update({
          nom,
          type,
          description: description.trim() || null,
          json_config: {
            ...config,
            htmlUrl,
            htmlSchema: schema,
            htmlDefaultData: { ...(activeDefaultData ?? {}), ...defaultValues },
            requirements: requirements.length > 0 ? requirements : undefined,
          },
        })
        .eq("id", template.id);
      if (updateErr) throw updateErr;

      // Cover photo: manual upload takes priority over auto-generated preview
      if (coverFile) {
        setSaveStatus("Upload de la couverture…");
        const coverKey = `previews/${slugify(nom)}-cover-${Date.now()}.${coverFile.name.split(".").pop() ?? "jpg"}`;
        const { error: coverErr } = await supabase.storage
          .from("previews")
          .upload(coverKey, await coverFile.arrayBuffer(), {
            contentType: coverFile.type,
            upsert: false,
          });
        if (!coverErr) {
          const coverUrl = supabase.storage.from("previews").getPublicUrl(coverKey).data.publicUrl;
          await supabase.from("templates").update({ preview_url: coverUrl }).eq("id", template.id);
        }
      } else {
        // Auto-generate preview from the HTML (best-effort)
        const htmlForPreview = newHtml ?? currentHtml;
        if (htmlForPreview && schema) {
          setSaveStatus("Génération de l'aperçu…");
          const blob = await generatePreview(
            htmlForPreview,
            schema,
            activeDefaultData,
            canvasWidth,
            canvasHeight,
          );
          if (blob) {
            const key = `previews/${slugify(nom)}-${Date.now()}.png`;
            const { error: previewErr } = await supabase.storage
              .from("previews")
              .upload(key, await blob.arrayBuffer(), { contentType: "image/png", upsert: true });
            if (!previewErr) {
              const previewUrl = supabase.storage.from("previews").getPublicUrl(key).data.publicUrl;
              await supabase.from("templates").update({ preview_url: previewUrl }).eq("id", template.id);
            }
          }
        }
      }

      router.push("/admin/templates");
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Échec de la sauvegarde.");
      setSaving(false);
      setSaveStatus("");
    }
  };

  const displaySchema = newSchema ?? config.htmlSchema ?? null;

  return (
    <div className="space-y-8">
      {/* ── Metadata ── */}
      <section className="grid gap-4 max-w-lg">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-muted">Informations</h2>

        <div className="space-y-1">
          <label className="text-sm font-medium">Nom</label>
          <input className={inputClass} value={nom} onChange={(e) => setNom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Type</label>
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as TemplateType)}>
            {TEMPLATE_TYPES.map((t) => (
              <option key={t} value={t}>{TEMPLATE_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Description <span className="text-muted">(optionnel)</span></label>
          <textarea className={inputClass} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="flex gap-3 text-sm text-muted">
          <div className="rounded-lg border border-border bg-surface px-3 py-2 flex-1">
            <span className="block text-xs uppercase tracking-wide mb-0.5">Largeur</span>
            <span className="font-medium text-foreground">{canvasWidth} px</span>
          </div>
          <div className="rounded-lg border border-border bg-surface px-3 py-2 flex-1">
            <span className="block text-xs uppercase tracking-wide mb-0.5">Hauteur</span>
            <span className="font-medium text-foreground">{canvasHeight} px</span>
          </div>
        </div>
      </section>

      {/* ── Requirements ── */}
      <section className="space-y-3 max-w-lg">
        <div>
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted">Données requises</h2>
          <p className="text-xs text-muted mt-0.5">
            Sélections ou données automatiques injectées dans{" "}
            <code className="rounded bg-surface-2 px-1 text-xs">TEMPLATE_DATA</code> sous la clé de l&apos;identifiant.
          </p>
        </div>

        {requirements.map((req, i) => {
          const isMatchReq = req.type === "match_pick" || req.type === "results_pick";
          const updateReq = (patch: Partial<DataRequirement>) =>
            setRequirements((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
          return (
            <div key={i} className="space-y-1.5">
              <div className="flex flex-wrap items-start gap-2">
                <select
                  className={`${inputClass} flex-1 min-w-0`}
                  value={req.type}
                  onChange={(e) => updateReq({ type: e.target.value as DataRequirementType })}
                >
                  {(Object.keys(REQUIREMENT_TYPE_LABELS) as DataRequirementType[]).map((t) => (
                    <option key={t} value={t}>{REQUIREMENT_TYPE_LABELS[t]}</option>
                  ))}
                </select>
                <input
                  className={`${inputClass} flex-1 min-w-0`}
                  value={req.id}
                  placeholder="Identifiant (ex: match)"
                  onChange={(e) => updateReq({ id: e.target.value })}
                />
                <input
                  className={`${inputClass} flex-1 min-w-0`}
                  value={req.label}
                  placeholder="Label affiché à l'utilisateur"
                  onChange={(e) => updateReq({ label: e.target.value })}
                />
                {req.type === "results_pick" && (
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className={`${inputClass} w-24`}
                    value={req.maxItems ?? ""}
                    placeholder="Max"
                    title="Nombre max de matchs sélectionnables"
                    onChange={(e) =>
                      updateReq({ maxItems: e.target.value ? Number(e.target.value) : undefined })
                    }
                  />
                )}
                <button
                  type="button"
                  onClick={() => setRequirements((rs) => rs.filter((_, j) => j !== i))}
                  className="text-muted hover:text-red-500 text-lg leading-none px-1 mt-1.5"
                  title="Supprimer"
                >
                  ×
                </button>
              </div>
              {isMatchReq && (
                <select
                  className={`${inputClass} text-xs`}
                  value={req.matchFilter ?? "all"}
                  onChange={(e) =>
                    updateReq({ matchFilter: e.target.value as "all" | "played" | "upcoming" })
                  }
                >
                  <option value="all">Tous les matchs</option>
                  <option value="played">Matchs joués seulement</option>
                  <option value="upcoming">Matchs à venir seulement</option>
                </select>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() =>
            setRequirements((rs) => [
              ...rs,
              { id: `req_${Date.now()}`, type: "match_pick", label: "" },
            ])
          }
          className="text-sm text-primary hover:underline"
        >
          + Ajouter une donnée requise
        </button>
      </section>

      {/* ── Default values ── */}
      {editableDefaults.length > 0 && (
        <section className="space-y-3 max-w-lg">
          <div>
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted">Valeurs par défaut</h2>
            <p className="text-xs text-muted mt-0.5">
              Pré-remplissage des champs texte. Laisser vide = champ vide à l&apos;ouverture.
            </p>
          </div>
          {editableDefaults.map((s) => (
            <div key={s.key} className="space-y-1">
              <label className="text-sm font-medium">{s.label}</label>
              <input
                className={inputClass}
                type={s.type === "number" ? "number" : "text"}
                value={defaultValues[s.key] ?? ""}
                onChange={(e) =>
                  setDefaultValues((prev) => ({ ...prev, [s.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </section>
      )}

      {/* ── Files + Preview ── */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-5">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted">
            Fichiers <span className="normal-case font-normal text-muted">(laisser vide pour conserver l&apos;existant)</span>
          </h2>

          {/* Current schema */}
          {displaySchema && (
            <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
              <p className="text-xs font-medium text-muted uppercase tracking-wide">
                {newSchema ? "Nouveau schéma" : "Schéma actuel"}
              </p>
              <ul className="space-y-1">
                {displaySchema.sections.map((s) => (
                  <li key={s.key} className="text-xs flex items-center gap-2">
                    <code className="rounded bg-surface-2 px-1.5 py-0.5 text-muted">{s.key}</code>
                    <span className="text-muted">
                      {s.type === "object"
                        ? `objet (${s.fields?.length ?? 0} sous-champs)`
                        : s.type === "array"
                        ? `liste (${s.arrayItem?.length ?? 0} colonnes)`
                        : s.type}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium">Fichier HTML</label>
            <p className="text-xs text-muted">Le schéma de données est inféré automatiquement des attributs <code>data-bind-*</code>.</p>
            <input
              type="file"
              accept=".html,text/html"
              className="text-sm"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onHtmlFile(f); }}
            />
            {newHtmlName && <p className="text-xs text-accent">✓ {newHtmlName}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Photo de couverture</label>
            <p className="text-xs text-muted">
              Affiché dans la galerie des templates. Si absent, un aperçu est généré automatiquement.
            </p>
            <div className="flex items-start gap-4">
              {(coverPreview ?? template.preview_url) && (
                <img
                  src={coverPreview ?? template.preview_url}
                  alt="Couverture"
                  className="h-24 w-24 rounded-lg border border-border object-cover shrink-0"
                />
              )}
              <input
                type="file"
                accept="image/*"
                className="text-sm"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onCoverFile(f); }}
              />
            </div>
            {coverFile && <p className="text-xs text-accent">✓ {coverFile.name}</p>}
          </div>

          {fileError && <p className="text-sm text-red-400">{fileError}</p>}
          {fetchError && (
            <p className="text-sm text-amber-400">
              Impossible de charger le HTML actuel depuis le stockage. L&apos;aperçu sera indisponible.
            </p>
          )}
        </section>

        {/* Preview */}
        <section className="space-y-2">
          <p className="text-sm font-semibold">Aperçu</p>
          <div
            ref={wrapperRef}
            className="overflow-hidden rounded-lg border border-border bg-black relative"
            style={{
              height: scale > 0 ? Math.round(wrapperWidth * canvasHeight / canvasWidth) : 160,
              minHeight: 160,
            }}
          >
            {previewSrcdoc && scale > 0 ? (
              <div style={{
                width: canvasWidth,
                height: canvasHeight,
                transform: `scale(${scale})`,
                transformOrigin: "0 0",
              }}>
                <iframe
                  key={previewSrcdoc}
                  title="Aperçu"
                  srcDoc={previewSrcdoc}
                  sandbox="allow-scripts"
                  style={{ width: canvasWidth, height: canvasHeight, border: 0, display: "block" }}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">
                {!currentHtml && !fetchError ? "Chargement…" : "Aperçu non disponible"}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Actions ── */}
      {saveError && <p className="text-sm text-red-400">{saveError}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={saving}
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground disabled:opacity-40"
        >
          ← Retour
        </button>
        <button
          type="button"
          disabled={saving || !nom.trim()}
          onClick={save}
          className="rounded-2xl bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
        >
          {saving ? saveStatus : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
