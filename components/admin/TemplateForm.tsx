"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FieldBuilder } from "./FieldBuilder";
import { SampleValuesForm } from "./SampleValuesForm";
import { AdminTemplatePreview } from "./AdminTemplatePreview";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_WIDTH,
  hasDesignPng,
  hasSampleValues,
} from "@/lib/canvas";
import { isSupabaseConfigured } from "@/lib/env";
import {
  TEMPLATE_TYPES,
  TEMPLATE_TYPE_LABELS,
  type DataRequirement,
  type DataRequirementType,
  type Field,
  type FieldValues,
  type JsonConfig,
  type Template,
  type TemplateType,
} from "@/lib/types";

const REQUIREMENT_TYPE_LABELS: Record<DataRequirementType, string> = {
  last_match: "Dernier match joué (auto)",
  next_match: "Prochain match à venir (auto)",
  match_pick: "Match au choix",
  results_pick: "Plusieurs matchs au choix (liste)",
  standings: "Classement complet (auto)",
  team_pick: "Équipe au choix",
  league: "Données ligue — nom, logo, division (auto)",
};

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => reject(new Error("Image illisible"));
    img.src = url;
  });
}

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors";

export interface TemplateFormProps {
  mode: "create" | "edit";
  initial?: Template;
}

export function TemplateForm({ mode, initial }: TemplateFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  if (isEdit && initial?.json_config.templateMode === "html") {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 space-y-3 max-w-lg">
        <p className="font-medium">Template HTML/JS</p>
        <p className="text-sm text-muted">
          Ce template est rendu via HTML/JS. L&apos;édition du contenu HTML n&apos;est pas encore disponible.
          Pour modifier ce template, supprimez-le puis réimportez-le depuis{" "}
          <strong>Créer un template → Importer HTML/JS</strong>.
        </p>
        <div className="text-sm space-y-1 pt-2">
          <p><span className="text-muted">Nom :</span> {initial.nom}</p>
          <p><span className="text-muted">Type :</span> {TEMPLATE_TYPE_LABELS[initial.type]}</p>
          <p><span className="text-muted">Canvas :</span> {initial.json_config.canvasWidth} × {initial.json_config.canvasHeight}</p>
        </div>
        <button type="button" onClick={() => router.back()}
          className="rounded-md border border-input px-4 py-2 text-sm text-muted hover:text-foreground hover:border-primary/40 transition-colors">
          ← Retour
        </button>
      </div>
    );
  }
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [nom, setNom] = useState(initial?.nom ?? "");
  const [type, setType] = useState<TemplateType>(initial?.type ?? "resultat");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [pngFile, setPngFile] = useState<File | null>(null);
  const [pngUrl, setPngUrl] = useState(initial?.png_url ?? "");
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    initial
      ? {
          width: initial.json_config.canvasWidth,
          height: initial.json_config.canvasHeight,
        }
      : { width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT },
  );
  const [fields, setFields] = useState<Field[]>(initial?.json_config.fields ?? []);
  const [sampleValues, setSampleValues] = useState<FieldValues>(
    initial?.json_config.sampleValues ?? {},
  );
  const [requirements, setRequirements] = useState<DataRequirement[]>(
    initial?.json_config.requirements ?? [],
  );

  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewLocalUrl, setPreviewLocalUrl] = useState(initial?.preview_url ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jsonConfig = useMemo((): JsonConfig | null => {
    if (!size) return null;
    const config: JsonConfig = {
      canvasWidth: size.width,
      canvasHeight: size.height,
      fields,
    };
    if (hasSampleValues(sampleValues)) config.sampleValues = sampleValues;
    if (requirements.length > 0) config.requirements = requirements;
    return config;
  }, [size, fields, sampleValues, requirements]);

  if (!isSupabaseConfigured()) {
    return (
      <p className="rounded-lg border border-border bg-surface p-8 text-muted">
        Supabase n&apos;est pas configuré. Voir <code>.env.example</code>.
      </p>
    );
  }

  const onPngSelected = async (file: File) => {
    setPngFile(file);
    setPngUrl(URL.createObjectURL(file));
    try {
      setSize(await readImageSize(file));
    } catch {
      setError("Impossible de lire les dimensions du PNG.");
    }
  };

  const onPreviewSelected = (file: File) => {
    setPreviewFile(file);
    setPreviewLocalUrl(URL.createObjectURL(file));
  };

  const canProceedStep1 = Boolean(nom.trim() && size);

  const setCanvasDimension = (key: "width" | "height", value: number) => {
    if (!Number.isFinite(value) || value < 1) return;
    setSize((prev) =>
      prev ? { ...prev, [key]: Math.round(value) } : prev,
    );
  };

  const save = async () => {
    if (!size || !jsonConfig) return;

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      let png_url = initial?.png_url ?? "";
      let preview_url = initial?.preview_url ?? "";

      if (pngFile) {
        const base = `${slugify(nom) || "template"}-${Date.now()}`;
        const { error: pngError } = await supabase.storage
          .from("templates")
          .upload(`${base}.png`, pngFile, {
            contentType: pngFile.type || "image/png",
            upsert: false,
          });
        if (pngError) throw pngError;
        png_url = supabase.storage.from("templates").getPublicUrl(`${base}.png`)
          .data.publicUrl;
      }

      if (previewFile) {
        const ext = previewFile.name.split(".").pop() ?? "jpg";
        const previewKey = `preview-${slugify(nom)}-${Date.now()}.${ext}`;
        const { error: previewUploadError } = await supabase.storage
          .from("previews")
          .upload(previewKey, previewFile, {
            contentType: previewFile.type || "image/jpeg",
            upsert: true,
          });
        if (previewUploadError) throw previewUploadError;
        preview_url = supabase.storage
          .from("previews")
          .getPublicUrl(previewKey).data.publicUrl;
      }

      if (isEdit && initial) {
        const { error: updateError } = await supabase
          .from("templates")
          .update({
            nom,
            type,
            description: description.trim() || null,
            png_url,
            preview_url,
            json_config: jsonConfig,
          })
          .eq("id", initial.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("templates")
          .insert({
            nom,
            type,
            description: description.trim() || null,
            png_url,
            preview_url,
            json_config: jsonConfig,
            actif: true,
          });
        if (insertError) throw insertError;
      }

      router.push("/admin/templates");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la sauvegarde.");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Stepper step={step} />

      {step === 1 ? (
        <div className="max-w-lg space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Nom</label>
            <input
              className={inputClass}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Type</label>
            <select
              className={inputClass}
              value={type}
              onChange={(e) => setType(e.target.value as TemplateType)}
            >
              {TEMPLATE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TEMPLATE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description (optionnel)</label>
            <textarea
              className={inputClass}
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              PNG de fond (optionnel)
              {isEdit ? " — laisser vide pour conserver ou retirer" : ""}
            </label>
            <p className="text-xs text-muted">
              Sans PNG : fond uni (#18181b). Utilisez les formes ou un calque
              image pour le design.
            </p>
            <input
              type="file"
              accept="image/png"
              className="text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPngSelected(f);
              }}
            />
            {isEdit && hasDesignPng(pngUrl) && !pngFile ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pngUrl}
                alt="Fond actuel"
                className="mt-2 max-h-32 rounded border border-border object-contain"
              />
            ) : null}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Image de prévisualisation
              {isEdit ? " — laisser vide pour conserver" : ""}
            </label>
            <p className="text-xs text-muted">
              Photo affichée dans la bibliothèque de templates (PNG, JPG, WebP).
            </p>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPreviewSelected(f);
              }}
            />
            {previewLocalUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewLocalUrl}
                alt="Aperçu preview"
                className="mt-2 max-h-32 rounded border border-border object-contain"
              />
            ) : null}
          </div>

          {size ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Largeur canvas (px)</label>
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={size.width}
                  disabled={isEdit}
                  onChange={(e) =>
                    setCanvasDimension("width", Number(e.target.value))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Hauteur canvas (px)</label>
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={size.height}
                  disabled={isEdit}
                  onChange={(e) =>
                    setCanvasDimension("height", Number(e.target.value))
                  }
                />
              </div>
              {isEdit ? (
                <p className="col-span-2 text-xs text-muted">
                  Dimensions verrouillées en édition.
                </p>
              ) : pngFile ? (
                <p className="col-span-2 text-xs text-muted">
                  Dimensions déduites du PNG (modifiables avant upload).
                </p>
              ) : null}
            </div>
          ) : null}
          {/* Requirements */}
          <div className="space-y-3 border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium">Données requises</p>
              <p className="text-xs text-muted mt-0.5">
                Données que l'utilisateur devra sélectionner ou qui seront
                remplies automatiquement depuis la ligue.
              </p>
            </div>
            {requirements.map((req, i) => {
              const isMatchReq = req.type === "match_pick" || req.type === "results_pick";
              const updateReq = (patch: Partial<DataRequirement>) =>
                setRequirements((rs) =>
                  rs.map((r, j) => (j === i ? { ...r, ...patch } : r)),
                );
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <select
                      className={`${inputClass} flex-1`}
                      value={req.type}
                      onChange={(e) =>
                        updateReq({ type: e.target.value as DataRequirementType })
                      }
                    >
                      {(Object.keys(REQUIREMENT_TYPE_LABELS) as DataRequirementType[]).map(
                        (t) => (
                          <option key={t} value={t}>
                            {REQUIREMENT_TYPE_LABELS[t]}
                          </option>
                        ),
                      )}
                    </select>
                    <input
                      className={`${inputClass} flex-1`}
                      value={req.label}
                      placeholder="Label affiché à l'utilisateur"
                      onChange={(e) => updateReq({ label: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setRequirements((rs) => rs.filter((_, j) => j !== i))
                      }
                      className="text-muted hover:text-red-500 text-lg leading-none px-1"
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
                        updateReq({
                          matchFilter: e.target.value as "all" | "played" | "upcoming",
                        })
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
                  {
                    id: `req_${Date.now()}`,
                    type: "match_pick",
                    label: "",
                  },
                ])
              }
              className="text-sm text-primary hover:underline"
            >
              + Ajouter une donnée requise
            </button>
          </div>

          <button
            type="button"
            disabled={!canProceedStep1}
            onClick={() => setStep(2)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
          >
            Continuer
          </button>
        </div>
      ) : null}

      {step === 2 && size && jsonConfig ? (
        <div className="space-y-6">
          <FieldBuilder
            backgroundUrl={pngUrl}
            canvasWidth={size.width}
            canvasHeight={size.height}
            fields={fields}
            onChange={setFields}
            requirements={requirements}
          />
          <div className="grid gap-6 xl:grid-cols-2">
            <SampleValuesForm
              fields={fields}
              values={sampleValues}
              onChange={setSampleValues}
            />
            <AdminTemplatePreview
              pngUrl={pngUrl}
              config={jsonConfig}
              sampleValues={sampleValues}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-md border border-input px-4 py-2 text-sm text-muted hover:text-foreground hover:border-primary/40 transition-colors"
            >
              ← Retour
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors"
            >
              Continuer
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="max-w-lg space-y-4">
          <div className="rounded-lg border border-border bg-surface p-4 text-sm">
            <p>
              <span className="text-muted">Nom :</span> {nom}
            </p>
            <p>
              <span className="text-muted">Type :</span>{" "}
              {TEMPLATE_TYPE_LABELS[type]}
            </p>
            <p>
              <span className="text-muted">Champs :</span> {fields.length}
            </p>
            <p>
              <span className="text-muted">Canvas :</span> {size?.width} ×{" "}
              {size?.height}
            </p>
            <p>
              <span className="text-muted">PNG design :</span>{" "}
              {hasDesignPng(pngUrl) || pngFile ? "oui" : "non (fond uni)"}
            </p>
            <p>
              <span className="text-muted">Image de prévisualisation :</span>{" "}
              {previewFile
                ? previewFile.name
                : previewLocalUrl
                  ? "conservée (existante)"
                  : "aucune"}
            </p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-md border border-input px-4 py-2 text-sm text-muted hover:text-foreground hover:border-primary/40 transition-colors"
            >
              ← Retour
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
            >
              {saving
                ? "Sauvegarde…"
                : isEdit
                  ? "Enregistrer les modifications"
                  : "Sauvegarder le template"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Infos", "Champs", "Sauvegarde"];
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
                ? "bg-primary text-primary-foreground"
                : done
                  ? "bg-surface-2 text-foreground"
                  : "bg-surface text-muted border border-border"
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
