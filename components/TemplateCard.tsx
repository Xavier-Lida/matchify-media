"use client";

import Link from "next/link";
import { useState } from "react";
import { TEMPLATE_TYPE_LABELS, type Template } from "@/lib/types";

export function TemplateCard({ template }: { template: Template }) {
  const [imgError, setImgError] = useState(false);
  const hasPreview = Boolean(template.preview_url?.trim()) && !imgError;

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-all hover:border-primary/40 hover:shadow-sm">
      {/* Thumbnail */}
      <div className="relative aspect-square w-full overflow-hidden bg-surface-2">
        {hasPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.preview_url}
            alt={`Aperçu — ${template.nom}`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-muted">
            Aperçu non disponible
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-md border border-input bg-surface/90 px-2 py-0.5 text-xs font-medium text-muted backdrop-blur">
          {TEMPLATE_TYPE_LABELS[template.type]}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="text-[15px] font-medium leading-tight text-foreground">
          {template.nom}
        </h3>
        {template.description && (
          <p className="line-clamp-2 text-sm text-muted leading-snug">
            {template.description}
          </p>
        )}
        <Link
          href={`/template/${template.id}`}
          className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors"
        >
          Utiliser →
        </Link>
      </div>
    </div>
  );
}
