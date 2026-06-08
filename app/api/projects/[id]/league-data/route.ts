import { NextResponse } from "next/server";
import { requireUserSession, UserAuthError } from "@/lib/api/require-user";
import { getProjectForUser, upsertLeagueData } from "@/lib/projects";
import type { LeagueDataSource } from "@/lib/types-user";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await requireUserSession();
    const project = await getProjectForUser(id, user.id);
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    const body = (await request.json()) as {
      data?: Record<string, unknown>;
      source?: LeagueDataSource;
    };

    if (!body.data || typeof body.data !== "object") {
      return NextResponse.json({ error: "Données requises." }, { status: 400 });
    }

    await upsertLeagueData(id, body.data, body.source ?? "manual");
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UserAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
