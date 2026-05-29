"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { buildLayeredRenderPlan } from "@/lib/canvas";
import type { FieldValues, JsonConfig } from "@/lib/types";

const CanvasEditor = dynamic(
  () => import("@/components/editor/CanvasEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-square w-full max-w-md items-center justify-center rounded-xl border border-border bg-surface-2 text-sm text-muted">
        Chargement de l&apos;aperçu…
      </div>
    ),
  },
);

export function AdminTemplatePreview({
  pngUrl,
  config,
  sampleValues,
}: {
  pngUrl: string;
  config: JsonConfig;
  sampleValues: FieldValues;
}) {
  const layeredPlan = useMemo(
    () => buildLayeredRenderPlan(config, sampleValues),
    [config, sampleValues],
  );

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Aperçu live</h3>
      <CanvasEditor
        config={config}
        pngUrl={pngUrl}
        layeredPlan={layeredPlan}
      />
    </div>
  );
}
