"use client";

import { useRef, useState } from "react";

import { FullTimeForm } from "@/components/forms/FullTimeForm";
import { TemplateEditorLayout } from "@/components/editors/TemplateEditorLayout";
import { TemplateCanvas } from "@/components/TemplateCanvas";
import { FullTimeVisual } from "@/components/templates/FullTimeVisual";
import { useBrandingContext } from "@/components/BrandingProvider";
import { FULLTIME_DEFAULTS } from "@/lib/templates/defaults";

export function FullTimeEditor() {
  const { branding } = useBrandingContext();
  const [data, setData] = useState(FULLTIME_DEFAULTS);
  const exportRef = useRef<HTMLDivElement>(null);

  return (
    <TemplateEditorLayout
      label="Résultat de match"
      description="Style broadcast Meridian — photo, score, logos, buteurs et journée."
      exportFilename="matchify-fulltime.png"
      exportRef={exportRef}
      form={<FullTimeForm data={data} onChange={setData} />}
      preview={
        <TemplateCanvas exportRef={exportRef}>
          <FullTimeVisual data={data} branding={branding} />
        </TemplateCanvas>
      }
    />
  );
}
