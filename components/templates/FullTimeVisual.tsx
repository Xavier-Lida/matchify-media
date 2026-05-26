"use client";

import { DesignThemeProvider } from "@/components/design/DesignThemeProvider";
import { ResultVisual } from "@/components/design/result/ResultVisual";
import { adaptResultData } from "@/lib/design/adapt-result";
import { themeFromBranding } from "@/lib/design/tokens";
import type { TemplateVisualProps, FullTimeData } from "@/lib/templates/types";

export function FullTimeVisual({
  data,
  branding,
}: TemplateVisualProps<FullTimeData>) {
  const resultData = adaptResultData(branding, data);
  const theme = themeFromBranding(
    branding.primaryColor,
    branding.secondaryColor,
  );

  return (
    <DesignThemeProvider theme={theme}>
      <ResultVisual data={resultData} />
    </DesignThemeProvider>
  );
}
