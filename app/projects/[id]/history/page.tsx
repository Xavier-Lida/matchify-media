import { listPublications } from "@/lib/projects";
import { getTemplateById } from "@/lib/templates";

export default async function ProjectHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const publications = await listPublications(id);

  const templateNames = new Map<string, string>();
  for (const pub of publications) {
    if (pub.template_id && !templateNames.has(pub.template_id)) {
      const t = await getTemplateById(pub.template_id);
      if (t) templateNames.set(pub.template_id, t.nom);
    }
  }

  if (publications.length === 0) {
    return (
      <p className="text-muted text-sm">
        Aucune publication pour le moment. Exportez un visuel depuis un
        template pour voir l&apos;historique ici.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {publications.map((pub) => (
        <li
          key={pub.id}
          className="rounded-lg border border-border bg-surface px-4 py-3 flex flex-wrap items-center justify-between gap-2"
        >
          <div>
            <p className="font-medium text-foreground">
              {pub.title ??
                (pub.template_id
                  ? templateNames.get(pub.template_id) ?? "Visuel"
                  : "Export")}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {new Date(pub.created_at).toLocaleString("fr-CA")} ·{" "}
              {pub.format.toUpperCase()}
            </p>
          </div>
          {pub.storage_path ? (
            <a
              href={pub.storage_path}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Télécharger
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
