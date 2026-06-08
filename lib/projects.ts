import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  LeagueDataRow,
  Project,
  ProjectAsset,
  ProjectIntegration,
  Publication,
} from "@/lib/types-user";

export async function listProjectsForUser(userId: string): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function getProjectForUser(
  projectId: string,
  userId: string,
): Promise<Project | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as Project | null) ?? null;
}

export async function createProject(
  userId: string,
  name: string,
): Promise<Project> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ owner_id: userId, name })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("league_data").insert({
    project_id: data.id,
    data: {},
    source: "manual",
  });

  return data as Project;
}

export async function getLeagueData(
  projectId: string,
): Promise<LeagueDataRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("league_data")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) throw error;
  return (data as LeagueDataRow | null) ?? null;
}

export async function upsertLeagueData(
  projectId: string,
  data: Record<string, unknown>,
  source: LeagueDataRow["source"],
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("league_data").upsert(
    { project_id: projectId, data, source, updated_at: new Date().toISOString() },
    { onConflict: "project_id" },
  );

  if (error) throw error;
}

export async function listIntegrations(
  projectId: string,
): Promise<ProjectIntegration[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_integrations")
    .select("*")
    .eq("project_id", projectId);

  if (error) throw error;
  return (data ?? []) as ProjectIntegration[];
}

export async function upsertIntegration(
  projectId: string,
  provider: ProjectIntegration["provider"],
  config: Record<string, unknown>,
  status: ProjectIntegration["status"] = "connected",
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_integrations").upsert(
    {
      project_id: projectId,
      provider,
      config,
      status,
      last_sync_at: new Date().toISOString(),
    },
    { onConflict: "project_id,provider" },
  );

  if (error) throw error;
}

export async function listPublications(
  projectId: string,
): Promise<Publication[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("publications")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Publication[];
}

export async function recordPublication(input: {
  projectId: string;
  userId: string;
  templateId?: string;
  format: Publication["format"];
  title?: string;
  storagePath?: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("publications").insert({
    project_id: input.projectId,
    user_id: input.userId,
    template_id: input.templateId ?? null,
    format: input.format,
    title: input.title ?? null,
    storage_path: input.storagePath ?? null,
  });

  if (error) throw error;
}

export async function listProjectAssets(
  projectId: string,
): Promise<ProjectAsset[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_assets")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ProjectAsset[];
}

export async function insertProjectAsset(
  projectId: string,
  filePath: string,
  label?: string,
): Promise<ProjectAsset> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_assets")
    .insert({ project_id: projectId, file_path: filePath, label: label ?? null })
    .select()
    .single();

  if (error) throw error;
  return data as ProjectAsset;
}
