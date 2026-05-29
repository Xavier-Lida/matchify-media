import { NextResponse, type NextRequest } from "next/server";
import { isValidSpordleUrl, scrapeSpordleMatch } from "@/lib/spordle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  // 400 si l'URL n'est pas une URL Spordle valide
  if (!url || !isValidSpordleUrl(url)) {
    return NextResponse.json(
      { error: "URL Spordle invalide." },
      { status: 400 },
    );
  }

  try {
    const data = await scrapeSpordleMatch(url);
    return NextResponse.json(data, { status: 200 });
  } catch {
    // 502 si le scraping échoue (site indisponible ou structure changée)
    return NextResponse.json(
      { error: "Échec du scraping Spordle (site indisponible ou structure changée)." },
      { status: 502 },
    );
  }
}
