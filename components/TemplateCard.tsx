import Link from "next/link";
import { TEMPLATE_TYPE_LABELS, type Template } from "@/lib/types";

export function TemplateCard({ template }: { template: Template }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent/60">
      <div className="relative aspect-square w-full overflow-hidden bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={template.preview_url}
          alt={`Aperçu — ${template.nom}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <span className="absolute left-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium text-muted backdrop-blur">
          {TEMPLATE_TYPE_LABELS[template.type]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-semibold leading-tight">{template.nom}</h3>
        {template.description ? (
          <p className="line-clamp-2 text-sm text-muted">
            {template.description}
          </p>
        ) : null}
        <Link
          href={`/template/${template.id}`}
          className="mt-auto inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
        >
          Utiliser
        </Link>
      </div>
    </div>
  );
}
