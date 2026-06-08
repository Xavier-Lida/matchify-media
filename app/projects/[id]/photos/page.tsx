import { PhotoBank } from "@/components/projects/PhotoBank";
import { getSessionUser } from "@/lib/auth/session";
import { listProjectAssets } from "@/lib/projects";
import { redirect } from "next/navigation";

export default async function ProjectPhotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const assets = await listProjectAssets(id);

  return <PhotoBank projectId={id} userId={user.id} assets={assets} />;
}
