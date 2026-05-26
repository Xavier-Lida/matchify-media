import { ExportButton } from "@/components/ExportButton";
import type { ReactNode, RefObject } from "react";

type TemplateEditorLayoutProps = {
  label: string;
  description: string;
  exportFilename: string;
  exportRef: RefObject<HTMLDivElement | null>;
  form: ReactNode;
  preview: ReactNode;
};

export function TemplateEditorLayout({
  label,
  description,
  exportFilename,
  exportRef,
  form,
  preview,
}: TemplateEditorLayoutProps) {
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <section className="flex w-full flex-col gap-4 lg:max-w-md lg:shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{label}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {form}
      </section>

      <section className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Aperçu · 1080×1350
          </h2>
          <ExportButton targetRef={exportRef} filename={exportFilename} />
        </div>
        {preview}
      </section>
    </div>
  );
}
