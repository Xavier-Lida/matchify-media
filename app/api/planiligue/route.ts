import { NextResponse, type NextRequest } from "next/server";
import {
  isValidPlaniligueUrl,
  scrapePlaniligueTournament,
} from "@/lib/planiligue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url || !isValidPlaniligueUrl(url)) {
    return NextResponse.json(
      { error: "URL Planiligue invalide." },
      { status: 400 },
    );
  }

  try {
    const data = await scrapePlaniligueTournament(url);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Échec du scraping Planiligue.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
