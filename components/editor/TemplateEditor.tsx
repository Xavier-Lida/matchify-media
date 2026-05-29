"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import type Konva from "konva";
import { DynamicForm } from "./DynamicForm";
import { SpordleImport } from "./SpordleImport";
import { buildLayeredRenderPlan } from "@/lib/canvas";
import type { SpordleMatchData } from "@/lib/spordle-types";
import type {
  FieldStyleOverride,
  FieldValues,
  JsonConfig,
  StyleOverrides,
  Template,
} from "@/lib/types";

// Konva ne peut tourner que côté navigateur → import dynamique sans SSR.
const CanvasEditor = dynamic(() => import("./CanvasEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-border bg-surface-2 text-muted">
      Chargement de l&apos;éditeur…
    </div>
  ),
});

function initialValues(config: JsonConfig): FieldValues {
  const values: FieldValues = {};
  for (const field of config.fields) {
    values[field.key] = field.type === "list" ? [] : "";
  }
  return values;
}

/** Clés conventionnelles renseignées par l'import Spordle (cf. SPEC.md). */
function spordleToValues(
  data: SpordleMatchData,
  config: JsonConfig,
): FieldValues {
  const keys = new Set(config.fields.map((f) => f.key));
  const next: FieldValues = {};
  const setIf = (key: string, value: string) => {
    if (keys.has(key) && value !== "") next[key] = value;
  };

  setIf("equipe_dom", data.equipe_dom);
  setIf("equipe_ext", data.equipe_ext);
  setIf("score_dom", data.score_dom !== null ? String(data.score_dom) : "");
  setIf("score_ext", data.score_ext !== null ? String(data.score_ext) : "");
  setIf("logo_dom", data.logo_dom ?? "");
  setIf("logo_ext", data.logo_ext ?? "");
  setIf("date", data.date ?? "");

  if (keys.has("buteurs") && data.buteurs.length > 0) {
    next.buteurs = data.buteurs.map((b) => ({ nom: b.nom, buts: b.buts }));
  }

  return next;
}

export function TemplateEditor({ template }: { template: Template }) {
  const config = template.json_config;
  const [values, setValues] = useState<FieldValues>(() =>
    initialValues(config),
  );
  const [overrides, setOverrides] = useState<StyleOverrides>({});
  const stageRef = useRef<Konva.Stage | null>(null);

  const layeredPlan = useMemo(
    () => buildLayeredRenderPlan(config, values, overrides),
    [config, values, overrides],
  );

  const handleValueChange = (key: string, value: FieldValues[string]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleOverrideChange = (key: string, override: FieldStyleOverride) =>
    setOverrides((prev) => ({ ...prev, [key]: override }));

  const handleSpordleImport = (data: SpordleMatchData) =>
    setValues((prev) => ({ ...prev, ...spordleToValues(data, config) }));

  const download = (format: "png" | "jpeg") => {
    const stage = stageRef.current;
    if (!stage) return;
    const pixelRatio = config.canvasWidth / stage.width();
    const mimeType = format === "png" ? "image/png" : "image/jpeg";
    const dataUrl = stage.toDataURL({
      mimeType,
      quality: format === "jpeg" ? 0.92 : 1,
      pixelRatio,
    });
    const link = document.createElement("a");
    const slug = template.nom.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    link.download = `${slug}-${Date.now()}.${format === "png" ? "png" : "jpg"}`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-4">
        <CanvasEditor
          config={config}
          pngUrl={template.png_url}
          layeredPlan={layeredPlan}
          stageRef={stageRef}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => download("png")}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Télécharger PNG
          </button>
          <button
            type="button"
            onClick={() => download("jpeg")}
            className="rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-medium hover:border-accent"
          >
            Télécharger JPG
          </button>
        </div>
      </div>

      <aside className="space-y-4">
        <SpordleImport onImport={handleSpordleImport} />
        <DynamicForm
          fields={config.fields}
          values={values}
          overrides={overrides}
          onValueChange={handleValueChange}
          onOverrideChange={handleOverrideChange}
        />
      </aside>
    </div>
  );
}
