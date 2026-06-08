import { LeagueDataEditor } from "@/components/projects/LeagueDataEditor";
import { getLeagueData } from "@/lib/projects";
import { fromRaw } from "@/lib/league-data";

export default async function ProjectDataPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await getLeagueData(id);
  const initialData = fromRaw(row?.data ?? {});

  return (
    <LeagueDataEditor
      projectId={id}
      initialData={initialData}
      source={row?.source ?? "manual"}
    />
  );
}
