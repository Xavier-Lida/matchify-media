"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FieldBuilder } from "./FieldBuilder";
import { SampleValuesForm } from "./SampleValuesForm";
import { AdminTemplatePreview } from "./AdminTemplatePreview";
import { createClient } from "@/lib/supabase/client";
import { hasSampleValues } from "@/lib/canvas";
import { isSupabaseConfigured } from "@/lib/env";
import {
  TEMPLATE_TYPES,
  TEMPLATE_TYPE_LABELS,
  type Field,
  type FieldValues,
  type JsonConfig,
  type Template,
  type TemplateType,
} from "@/lib/types";

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
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent";

export interface TemplateFormProps {
  mode: "create" | "edit";
  initial?: Template;
}

export function TemplateForm({ mode, initial }: TemplateFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
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
      : null,
  );
  const [fields, setFields] = useState<Field[]>(initial?.json_config.fields ?? []);
  const [sampleValues, setSampleValues] = useState<FieldValues>(
    initial?.json_config.sampleValues ?? {},
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jsonConfig = useMemo((): JsonConfig | null => {
    if (!size) return null;
    const config: JsonConfig = {
      canvasWidth: size.width,
      canvasHeight: size.height,
      fields,
    };
    if (hasSampleValues(sampleValues)) {
      config.sampleValues = sampleValues;
    }
    return config;
  }, [size, fields, sampleValues]);

  if (!isSupabaseConfigured()) {
    return (
      <p className="rounded-xl border border-border bg-surface p-8 text-muted">
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

  const canProceedStep1 = Boolean(nom.trim() && size && (isEdit || pngFile));

  async function generatePreviewUrl(
    png_url: string,
    config: JsonConfig,
    templateId?: string,
  ): Promise<string | null> {
    if (!hasSampleValues(config.sampleValues)) return null;

    const storage_key = `preview-${slugify(nom)}-${templateId ?? Date.now()}.png`;
    const res = await fetch("/api/admin/templates/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ png_url, json_config: config, storage_key }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? "Échec de génération de l'aperçu.");
    }
    return data.preview_url as string;
  }

  const save = async () => {
    if (!size || !jsonConfig) return;
    if (!isEdit && !pngFile) return;

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      let png_url = initial?.png_url ?? "";

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

      let preview_url = initial?.preview_url ?? png_url;

      if (isEdit && initial) {
        const { error: updateError } = await supabase
          .from("templates")
          .update({
            nom,
            type,
            description: description.trim() || null,
            png_url,
            json_config: jsonConfig,
          })
          .eq("id", initial.id);
        if (updateError) throw updateError;

        const generated = await generatePreviewUrl(
          png_url,
          jsonConfig,
          initial.id,
        );
        if (generated) preview_url = generated;

        const { error: previewUpdateError } = await supabase
          .from("templates")
          .update({ preview_url })
          .eq("id", initial.id);
        if (previewUpdateError) throw previewUpdateError;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("templates")
          .insert({
            nom,
            type,
            description: description.trim() || null,
            png_url,
            preview_url,
            json_config: jsonConfig,
            actif: true,
          })
          .select("id")
          .single();
        if (insertError) throw insertError;

        const generated = await generatePreviewUrl(
          png_url,
          jsonConfig,
          inserted.id,
        );
        if (generated) {
          preview_url = generated;
          await supabase
            .from("templates")
            .update({ preview_url })
            .eq("id", inserted.id);
        }
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
              PNG de fond {isEdit ? "(laisser vide pour conserver)" : ""}
            </label>
            <input
              type="file"
              accept="image/png"
              className="text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPngSelected(f);
              }}
            />
            {isEdit && pngUrl && !pngFile ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pngUrl}
                alt="Fond actuel"
                className="mt-2 max-h-32 rounded border border-border object-contain"
              />
            ) : null}
            {size ? (
              <p className="text-xs text-muted">
                Dimensions : {size.width} × {size.height} px
                {isEdit && !pngFile ? " (verrouillées en édition)" : ""}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={!canProceedStep1}
            onClick={() => setStep(2)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
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
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
            >
              ← Retour
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
            >
              Continuer
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="max-w-lg space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4 text-sm">
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
              <span className="text-muted">Aperçu auto :</span>{" "}
              {hasSampleValues(sampleValues)
                ? "oui (valeurs d'exemple)"
                : "non (preview = PNG de fond)"}
            </p>
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
            >
              ← Retour
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
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
