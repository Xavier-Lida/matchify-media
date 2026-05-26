"use client";

import { useRef, useState } from "react";

import { useBrandingContext } from "@/components/BrandingProvider";
import { ExportButton } from "@/components/ExportButton";
import { StandingsForm } from "@/components/forms/StandingsForm";
import { TemplateCanvas } from "@/components/TemplateCanvas";
import { StandingsVisual } from "@/components/templates/StandingsVisual";
import { TemplateEditorLayout } from "@/components/editors/TemplateEditorLayout";
import { STANDINGS_DEFAULTS } from "@/lib/templates/defaults";

export function StandingsEditor() {
  const { branding } = useBrandingContext();
  const [data, setData] = useState(STANDINGS_DEFAULTS);
  const exportRef = useRef<HTMLDivElement>(null);

  return (
    <TemplateEditorLayout
      label="Classement"
      description="Tableau de la journée avec stats et points (8 équipes max)."
      exportFilename="matchify-standings.png"
      exportRef={exportRef}
      form={<StandingsForm data={data} onChange={setData} />}
      preview={
        <TemplateCanvas exportRef={exportRef}>
          <StandingsVisual data={data} branding={branding} />
        </TemplateCanvas>
      }
    />
  );
}
