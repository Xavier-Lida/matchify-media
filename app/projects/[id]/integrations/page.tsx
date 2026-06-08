import { IntegrationsPanel } from "@/components/projects/IntegrationsPanel";
import { listIntegrations } from "@/lib/projects";

export default async function ProjectIntegrationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const integrations = await listIntegrations(id);
  const existing = integrations[0] ?? null;

  return (
    <div className="mx-auto max-w-xl">
      <IntegrationsPanel projectId={id} existing={existing} />
    </div>
  );
}
