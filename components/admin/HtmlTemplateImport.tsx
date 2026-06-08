"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  buildTemplateData,
  initialHtmlFormValues,
  injectDataIntoHtml,
  parseHtmlSchema,
} from "@/lib/html-template";
import { useElementWidth } from "@/lib/hooks/use-element-width";
import { isSupabaseConfigured } from "@/lib/env";
import {
  TEMPLATE_TYPES,
  TEMPLATE_TYPE_LABELS,
  type DataRequirement,
  type DataRequirementType,
  type HtmlSchema,
  type HtmlSchemaSection,
  type TemplateType,
} from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent";

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const ARRAY_REQ_OPTIONS: Array<{ value: DataRequirementType; label: string; description: string }> = [
  {
    value: "results_pick",
    label: "Résultats — choix utilisateur",
    description: "L'utilisateur sélectionne les matchs joués à afficher lors de la création du visuel.",
  },
  {
    value: "standings",
    label: "Classement complet — automatique",
    description: "Toutes les équipes du classement sont injectées automatiquement depuis la ligue connectée.",
  },
];

const OBJECT_REQ_OPTIONS: Array<{ value: DataRequirementType; label: string; description: string }> = [
  {
    value: "league",
    label: "Données ligue — automatique",
    description: "Nom, logo et division de la ligue, remplis automatiquement depuis le projet connecté.",
  },
  {
    value: "last_match",
    label: "Dernier match joué — automatique",
    description: "Le dernier match avec un score est sélectionné automatiquement.",
  },
  {
    value: "next_match",
    label: "Prochain match — automatique",
    description: "Le prochain match sans score est sélectionné automatiquement.",
  },
  {
    value: "match_pick",
    label: "Match — choix utilisateur",
    description: "L'utilisateur choisit un match dans l'horaire de sa ligue.",
  },
  {
    value: "team_pick",
    label: "Équipe — choix utilisateur",
    description: "L'utilisateur choisit une équipe dans le classement de sa ligue.",
  },
];

const ALL_OPTIONS = [...ARRAY_REQ_OPTIONS, ...OBJECT_REQ_OPTIONS];

const REQ_DEFAULT_LABELS: Record<DataRequirementType, string> = {
  last_match:   "Dernier match joué",
  next_match:   "Prochain match à venir",
  match_pick:   "Match au choix",
  results_pick: "Résultats à afficher",
  standings:    "Classement complet",
  team_pick:    "Équipe au choix",
  league:       "Données de la ligue",
};

// ─── Smart defaults ───────────────────────────────────────────────────────────

function guessRequirementType(
  key: string,
  sectionType: string,
): DataRequirementType | "" {
  const k = key.toLowerCase();
  if (sectionType === "array") {
    if (k.includes("match") || k.includes("result") || k.includes("game") || k.includes("score"))
      return "results_pick";
    if (k.includes("stand") || k.includes("classement") || k.includes("ranking"))
      return "standings";
  }
  if (sectionType === "object") {
    if (k === "brand" || k.includes("league") || k.includes("ligue") || k.includes("club"))
      return "league";
    if (k.includes("last") || k === "match" || k.includes("dernier") || k.includes("result"))
      return "last_match";
    if (k.includes("next") || k.includes("prochain") || k.includes("upcoming"))
      return "next_match";
    if (k.includes("team") || k.includes("equipe") || k.includes("club"))
      return "team_pick";
  }
  return "";
}

function guessDefaultValue(key: string, sectionType: string): string {
  if (sectionType !== "text" && sectionType !== "number") return "";
  const k = key.toLowerCase();
  if (k === "title" || k === "titre") return "RÉSULTATS";
  if (k.includes("subtitle") || k.includes("sous")) return "";
  if (k.includes("matchday") || k.includes("journee") || k.includes("round")) return "J. 1";
  if (k.includes("season") || k.includes("saison")) return "2025–2026";
  return "";
}

// ─── Preview upload helper ────────────────────────────────────────────────────

async function generateAndUploadPreview(
  supabase: ReturnType<typeof createClient>,
  html: string,
  schema: HtmlSchema,
  nom: string,
  width: number,
  height: number,
): Promise<string> {
  const data = buildTemplateData(schema, initialHtmlFormValues(schema));
  const injected = injectDataIntoHtml(html, data);
  const res = await fetch("/api/export-png", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html: injected, width, height }),
  });
  if (!res.ok) return "";
  const blob = await res.blob();
  const key = `previews/${slugify(nom) || "template"}-${Date.now()}.png`;
  const { error } = await supabase.storage
    .from("previews")
    .upload(key, await blob.arrayBuffer(), { contentType: "image/png", upsert: true });
  if (error) return "";
  return supabase.storage.from("previews").getPublicUrl(key).data.publicUrl;
}

// ─── Section type badge ───────────────────────────────────────────────────────

function SectionTypeBadge({ section }: { section: HtmlSchemaSection }) {
  let label = "";
  let cls = "bg-surface-2 text-muted";

  switch (section.type) {
    case "array":
      label = `liste · ${section.arrayItem?.length ?? 0} champ${(section.arrayItem?.length ?? 0) !== 1 ? "s" : ""}`;
      cls = "bg-blue-500/10 text-blue-400";
      break;
    case "object":
      label = `objet · ${section.fields?.length ?? 0} champ${(section.fields?.length ?? 0) !== 1 ? "s" : ""}`;
      cls = "bg-purple-500/10 text-purple-400";
      break;
    case "image":
      label = "image";
      cls = "bg-green-500/10 text-green-400";
      break;
    case "number":
      label = "nombre";
      cls = "bg-yellow-500/10 text-yellow-400";
      break;
    default:
      label = "texte";
      cls = "bg-surface-2 text-muted";
  }

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ─── Section mapping row ──────────────────────────────────────────────────────

function SectionMappingRow({
  section,
  mapping,
  defaultValue,
  onMappingChange,
  onDefaultChange,
}: {
  section: HtmlSchemaSection;
  mapping: DataRequirementType | "";
  defaultValue: string;
  onMappingChange: (v: DataRequirementType | "") => void;
  onDefaultChange: (v: string) => void;
}) {
  const options =
    section.type === "array"
      ? ARRAY_REQ_OPTIONS
      : section.type === "object"
        ? OBJECT_REQ_OPTIONS
        : null;

  const activeDescription = mapping
    ? ALL_OPTIONS.find((o) => o.value === mapping)?.description
    : null;

  const isScalar = section.type === "text" || section.type === "number";
  const isImage  = section.type === "image";

  return (
    <div className="py-3 border-b border-border last:border-0 space-y-2">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <code className="text-xs bg-surface-2 px-1.5 py-0.5 rounded text-foreground shrink-0 font-mono">
            {section.key}
          </code>
          <SectionTypeBadge section={section} />
        </div>

        {options ? (
          <select
            className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs outline-none focus:border-accent w-56 shrink-0"
            value={mapping}
            onChange={(e) => onMappingChange(e.target.value as DataRequirementType | "")}
          >
            <option value="">— Choisir une source —</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : isImage ? (
          <span className="text-xs text-muted italic shrink-0">
            Photo — choisie par l&apos;utilisateur
          </span>
        ) : null}
      </div>

      {/* Description de la source sélectionnée */}
      {activeDescription && (
        <p className="text-xs text-muted pl-1 leading-relaxed">{activeDescription}</p>
      )}

      {/* Valeur par défaut pour les champs texte/nombre sans source */}
      {isScalar && !mapping && (
        <div className="flex items-center gap-2 pl-1">
          <label className="text-xs text-muted shrink-0 w-32">Valeur par défaut :</label>
          <input
            type="text"
            className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs outline-none focus:border-accent flex-1"
            placeholder="Laisser vide si non applicable"
            value={defaultValue}
            onChange={(e) => onDefaultChange(e.target.value)}
          />
        </div>
      )}

      {/* Pas de source choisie pour array/object */}
      {options && !mapping && (
        <p className="text-xs text-amber-400 pl-1">
          ⚠ Choisissez une source — sinon cette section sera vide dans le visuel.
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HtmlTemplateImport() {
  const router = useRouter();

  // Step 1
  const [nom, setNom] = useState("");
  const [type, setType] = useState<TemplateType>("resultat");
  const [description, setDescription] = useState("");
  const [canvasWidth, setCanvasWidth] = useState(1080);
  const [canvasHeight, setCanvasHeight] = useState(1350);

  // Step 2
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [htmlFileName, setHtmlFileName] = useState<string | null>(null);
  const [schema, setSchema] = useState<HtmlSchema | null>(null);
  const [sectionMappings, setSectionMappings] = useState<Record<string, DataRequirementType | "">>({});
  const [defaultValues, setDefaultValues] = useState<Record<string, string>>({});

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previewWrapperRef, previewWrapperWidth] = useElementWidth();
  const previewScale = previewWrapperWidth > 0 ? previewWrapperWidth / canvasWidth : 0;

  const previewSrcdoc = useMemo(() => {
    if (!htmlContent || !schema) return null;
    const data = buildTemplateData(schema, initialHtmlFormValues(schema));
    return injectDataIntoHtml(htmlContent, data);
  }, [htmlContent, schema]);

  const onHtmlSelected = useCallback((file: File) => {
    setHtmlFileName(file.name);
    setError(null);
    setSchema(null);
    setSectionMappings({});
    setDefaultValues({});
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setHtmlContent(content);
      const parsed = parseHtmlSchema(content);
      setSchema(parsed);
      // Auto-detect smart defaults
      const autoMappings: Record<string, DataRequirementType | ""> = {};
      const autoDefaults: Record<string, string> = {};
      for (const section of parsed.sections) {
        const guess = guessRequirementType(section.key, section.type);
        if (guess) autoMappings[section.key] = guess;
        const def = guessDefaultValue(section.key, section.type);
        if (def) autoDefaults[section.key] = def;
      }
      setSectionMappings(autoMappings);
      setDefaultValues(autoDefaults);
    };
    reader.readAsText(file);
  }, []);

  const setMapping = useCallback((key: string, value: DataRequirementType | "") => {
    setSectionMappings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setDefaultValue = useCallback((key: string, value: string) => {
    setDefaultValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Computed requirements from section mappings
  const requirements = useMemo((): DataRequirement[] => {
    if (!schema) return [];
    return schema.sections
      .filter((s) => sectionMappings[s.key])
      .map((s) => {
        const t = sectionMappings[s.key] as DataRequirementType;
        return { id: s.key, type: t, label: REQ_DEFAULT_LABELS[t] };
      });
  }, [schema, sectionMappings]);

  const canProceedStep1 = Boolean(nom.trim());
  const canProceedStep2 = Boolean(htmlContent && schema);

  const save = async () => {
    if (!htmlContent || !schema) return;
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const base = `html/${slugify(nom) || "template"}-${Date.now()}`;

      const htmlBlob = new Blob([htmlContent], { type: "text/html" });
      const { error: uploadError } = await supabase.storage
        .from("templates")
        .upload(`${base}.html`, htmlBlob, { contentType: "text/html", upsert: false });
      if (uploadError) throw uploadError;

      const htmlUrl = supabase.storage
        .from("templates")
        .getPublicUrl(`${base}.html`).data.publicUrl;

      // Attach requirementId to bound sections
      const finalSchema: HtmlSchema = {
        sections: schema.sections.map((s) => {
          const reqType = sectionMappings[s.key];
          return reqType ? { ...s, requirementId: s.key } : s;
        }),
      };

      const { data: inserted, error: insertError } = await supabase
        .from("templates")
        .insert({
          nom,
          type,
          description: description.trim() || null,
          png_url: "",
          preview_url: "",
          actif: true,
          json_config: {
            canvasWidth,
            canvasHeight,
            fields: [],
            templateMode: "html",
            htmlUrl,
            htmlSchema: finalSchema,
            requirements: requirements.length > 0 ? requirements : undefined,
            htmlDefaultData: Object.keys(defaultValues).length > 0 ? defaultValues : undefined,
          },
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      generateAndUploadPreview(supabase, htmlContent, finalSchema, nom, canvasWidth, canvasHeight)
        .then((previewUrl) => {
          if (previewUrl && inserted) {
            supabase.from("templates").update({ preview_url: previewUrl }).eq("id", inserted.id);
          }
        })
        .catch(() => {});

      router.push("/admin/templates");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la sauvegarde.");
      setSaving(false);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <p className="rounded-lg border border-border bg-surface p-8 text-muted">
        Supabase n&apos;est pas configuré. Voir <code>.env.example</code>.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Stepper step={step} />

      {/* ── Step 1 : Infos ── */}
      {step === 1 && (
        <div className="max-w-lg space-y-4">
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
            <label className="text-sm font-medium">Description (optionnel)</label>
            <textarea className={inputClass} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Largeur canvas (px)</label>
              <input
                type="number" min={1} className={inputClass}
                value={canvasWidth}
                onChange={(e) => setCanvasWidth(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Hauteur canvas (px)</label>
              <input
                type="number" min={1} className={inputClass}
                value={canvasHeight}
                onChange={(e) => setCanvasHeight(Number(e.target.value))}
              />
            </div>
          </div>
          <button
            type="button"
            disabled={!canProceedStep1}
            onClick={() => setStep(2)}
            className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
          >
            Continuer
          </button>
        </div>
      )}

      {/* ── Step 2 : HTML + mapping ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Left column */}
            <div className="space-y-5">

              {/* HTML upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Fichier HTML <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-muted">
                  Les champs de données sont détectés automatiquement depuis les attributs{" "}
                  <code>data-bind</code> du fichier.
                </p>
                <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-dashed border-border bg-surface px-4 py-3 hover:border-accent transition-colors">
                  <span className="text-sm text-muted">
                    {htmlFileName ?? "Choisir un fichier .html…"}
                  </span>
                  <input
                    type="file"
                    accept=".html,text/html"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) onHtmlSelected(f); }}
                  />
                  <span className="ml-auto shrink-0 rounded-md border border-border px-3 py-1 text-xs hover:border-accent">
                    Parcourir
                  </span>
                </label>
                {htmlFileName && schema && (
                  <p className="text-xs text-accent">
                    ✓ {schema.sections.length} section{schema.sections.length !== 1 ? "s" : ""} détectée{schema.sections.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>

              {/* Schema + mapping */}
              {schema && schema.sections.length > 0 && (
                <div className="rounded-lg border border-border bg-surface">
                  <div className="px-4 pt-3 pb-2 border-b border-border space-y-1">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      Sections détectées — source de données
                    </p>
                    <p className="text-xs text-muted leading-relaxed">
                      Pour chaque section, choisissez d&apos;où viennent les données.
                      Les sources <strong>automatiques</strong> se remplissent sans action de l&apos;utilisateur.
                      Les sources <strong>choix utilisateur</strong> affichent une sélection lors de la création du visuel.
                    </p>
                  </div>
                  <div className="px-4">
                    {schema.sections.map((section) => (
                      <SectionMappingRow
                        key={section.key}
                        section={section}
                        mapping={sectionMappings[section.key] ?? ""}
                        defaultValue={defaultValues[section.key] ?? ""}
                        onMappingChange={(v) => setMapping(section.key, v)}
                        onDefaultChange={(v) => setDefaultValue(section.key, v)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {schema && schema.sections.length === 0 && (
                <p className="text-sm text-amber-400">
                  Aucun attribut <code>data-bind</code> détecté dans ce fichier.
                  Vérifiez que votre HTML utilise bien les attributs de liaison.
                </p>
              )}

              {requirements.length > 0 && (
                <div className="rounded-lg border border-border bg-surface px-4 py-3 space-y-1">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                    Données requises générées
                  </p>
                  {requirements.map((req) => (
                    <div key={req.id} className="flex items-center gap-2 text-xs">
                      <code className="bg-surface-2 px-1.5 py-0.5 rounded text-muted">{req.id}</code>
                      <span className="text-muted">{req.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>

            {/* Right column — preview */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Aperçu</p>
              <div
                ref={previewWrapperRef}
                className="overflow-hidden rounded-lg border border-border bg-black relative"
                style={{
                  height: previewScale > 0
                    ? Math.round(previewWrapperWidth * canvasHeight / canvasWidth)
                    : undefined,
                  minHeight: 120,
                }}
              >
                {previewSrcdoc && previewScale > 0 ? (
                  <div
                    style={{
                      width: canvasWidth,
                      height: canvasHeight,
                      transform: `scale(${previewScale})`,
                      transformOrigin: "0 0",
                    }}
                  >
                    <iframe
                      key={previewSrcdoc}
                      title="Aperçu template"
                      srcDoc={previewSrcdoc}
                      sandbox="allow-scripts"
                      style={{ width: canvasWidth, height: canvasHeight, border: 0, display: "block" }}
                    />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted text-sm absolute inset-0">
                    {htmlContent && !schema
                      ? "Analyse en cours…"
                      : "Chargez un fichier HTML pour voir l'aperçu"}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground">
              ← Retour
            </button>
            <button
              type="button"
              disabled={!canProceedStep2}
              onClick={() => setStep(3)}
              className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3 : Confirmation ── */}
      {step === 3 && (
        <div className="max-w-lg space-y-4">
          <div className="rounded-lg border border-border bg-surface p-4 text-sm space-y-1.5">
            <p><span className="text-muted">Nom :</span> {nom}</p>
            <p><span className="text-muted">Type :</span> {TEMPLATE_TYPE_LABELS[type]}</p>
            <p><span className="text-muted">Mode :</span> HTML/JS</p>
            <p><span className="text-muted">Canvas :</span> {canvasWidth} × {canvasHeight} px</p>
            <p><span className="text-muted">Sections :</span> {schema?.sections.length ?? 0}</p>
            {requirements.length > 0 && (
              <p>
                <span className="text-muted">Données requises :</span>{" "}
                {requirements.map((r) => r.label).join(", ")}
              </p>
            )}
            {schema && schema.sections.filter((s) => !sectionMappings[s.key]).length > 0 && (
              <p>
                <span className="text-muted">Sections manuelles :</span>{" "}
                {schema.sections.filter((s) => !sectionMappings[s.key]).map((s) => s.key).join(", ")}
              </p>
            )}
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(2)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground">
              ← Retour
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
            >
              {saving ? "Sauvegarde…" : "Sauvegarder le template"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Infos", "HTML & données", "Sauvegarde"];
  return (
    <ol className="flex flex-wrap gap-2 text-sm">
      {steps.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const active = n === step;
        const done = n < step;
        return (
          <li
            key={label}
            className={`flex items-center gap-2 rounded-full px-3 py-1 ${
              active
                ? "bg-accent text-accent-foreground"
                : done
                  ? "bg-surface text-foreground"
                  : "bg-surface text-muted"
            }`}
          >
            <span className="font-semibold">{n}</span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}
