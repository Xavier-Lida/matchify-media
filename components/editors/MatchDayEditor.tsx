"use client";

import { useRef, useState } from "react";

import { useBrandingContext } from "@/components/BrandingProvider";
import { ExportButton } from "@/components/ExportButton";
import { MatchDayForm } from "@/components/forms/MatchDayForm";
import { TemplateCanvas } from "@/components/TemplateCanvas";
import { MatchDayVisual } from "@/components/templates/MatchDayVisual";
import { TemplateEditorLayout } from "@/components/editors/TemplateEditorLayout";
import { MATCHDAY_DEFAULTS } from "@/lib/templates/defaults";

export function MatchDayEditor() {
  const { branding } = useBrandingContext();
  const [data, setData] = useState(MATCHDAY_DEFAULTS);
  const exportRef = useRef<HTMLDivElement>(null);

  return (
    <TemplateEditorLayout
      label="Annonce de match"
      description="Affiche la rencontre à venir avec date, heure et lieu."
      exportFilename="matchify-matchday.png"
      exportRef={exportRef}
      form={<MatchDayForm data={data} onChange={setData} />}
      preview={
        <TemplateCanvas exportRef={exportRef}>
          <MatchDayVisual data={data} branding={branding} />
        </TemplateCanvas>
      }
    />
  );
}
