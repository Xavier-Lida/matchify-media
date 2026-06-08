import { NextResponse } from "next/server";
import { requireUserSession, UserAuthError } from "@/lib/api/require-user";
import { getStandingsHandler } from "@/lib/standings";
import {
  getLeagueData,
  getProjectForUser,
  upsertIntegration,
  upsertLeagueData,
} from "@/lib/projects";
import { fromRaw, mergeWithProvider } from "@/lib/league-data";
import type { StandingsProvider } from "@/lib/types-user";

const PROVIDERS: StandingsProvider[] = ["spordle", "planiligue", "matchify"];

function isProvider(value: string): value is StandingsProvider {
  return PROVIDERS.includes(value as StandingsProvider);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider: raw } = await params;
    if (!isProvider(raw)) {
      return NextResponse.json({ error: "Provider inconnu." }, { status: 400 });
    }

    const { user } = await requireUserSession();
    const body = (await request.json()) as {
      projectId?: string;
      config?: Record<string, unknown>;
    };

    const projectId = body.projectId;
    if (!projectId) {
      return NextResponse.json({ error: "projectId requis." }, { status: 400 });
    }

    const project = await getProjectForUser(projectId, user.id);
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    const config = body.config ?? {};
    const handler = getStandingsHandler(raw);
    const data = await handler.sync(config);

    const existingRow = await getLeagueData(projectId);
    const existingUnified = fromRaw(existingRow?.data ?? {});
    const incomingUnified = fromRaw(data as Record<string, unknown>);
    const merged = mergeWithProvider(existingUnified, incomingUnified);

    await upsertIntegration(projectId, raw, config, "connected");
    await upsertLeagueData(projectId, merged as unknown as Record<string, unknown>, raw);

    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof UserAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Synchronisation échouée.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
