"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TEMPLATE_TYPE_LABELS, type Template } from "@/lib/types";

export function TemplatesManager({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggleActive = async (template: Template) => {
    setBusyId(template.id);
    await createClient()
      .from("templates")
      .update({ actif: !template.actif })
      .eq("id", template.id);
    setBusyId(null);
    router.refresh();
  };

  const remove = async (template: Template) => {
    if (!confirm(`Supprimer « ${template.nom} » ?`)) return;
    setBusyId(template.id);
    await createClient().from("templates").delete().eq("id", template.id);
    setBusyId(null);
    router.refresh();
  };

  if (templates.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface p-8 text-center text-muted">
        Aucun template. Créez-en un pour commencer.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface text-left text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Aperçu</th>
            <th className="px-4 py-3 font-medium">Nom</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Statut</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id} className="border-t border-border bg-surface-2/40">
              <td className="px-4 py-3">
                {t.preview_url?.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.preview_url}
                    alt=""
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-surface-2 text-[10px] text-muted">
                    —
                  </div>
                )}
              </td>
              <td className="px-4 py-3 font-medium">{t.nom}</td>
              <td className="px-4 py-3 text-muted">
                {TEMPLATE_TYPE_LABELS[t.type]}
              </td>
              <td className="px-4 py-3">
                <span
                  className={
                    t.actif
                      ? "rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                      : "rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted"
                  }
                >
                  {t.actif ? "Actif" : "Inactif"}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/templates/${t.id}/edit`}
                    className="rounded-md border border-input px-2.5 py-1 text-xs text-foreground hover:border-primary/40 transition-colors"
                  >
                    Éditer
                  </Link>
                  <button
                    type="button"
                    disabled={busyId === t.id}
                    onClick={() => toggleActive(t)}
                    className="rounded border border-border px-2.5 py-1 text-xs hover:border-accent disabled:opacity-50"
                  >
                    {t.actif ? "Désactiver" : "Activer"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === t.id}
                    onClick={() => remove(t)}
                    className="rounded-md border border-input px-2.5 py-1 text-xs text-destructive hover:border-destructive/50 transition-colors disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
