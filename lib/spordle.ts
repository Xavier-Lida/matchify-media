import "server-only";

import * as cheerio from "cheerio";
import type { SpordleMatchData, SpordleScorer } from "@/lib/spordle-types";

/**
 * Scraping d'une page de match Spordle.
 *
 * ⚠️ Les sélecteurs CSS ci-dessous sont déterminés par inspection du site et
 * sont susceptibles de changer. Dernière inspection: à compléter lors du
 * développement (le HTML public Spordle n'était pas accessible au moment de
 * l'implémentation). Le parseur est volontairement tolérant : tout champ non
 * trouvé renvoie `null`/`[]` plutôt que d'échouer.
 */

const SPORDLE_HOST = "spordle.com";

export function isValidSpordleUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    return host === SPORDLE_HOST || host.endsWith(`.${SPORDLE_HOST}`);
  } catch {
    return false;
  }
}

function parseScore(text: string | undefined): number | null {
  if (!text) return null;
  const match = text.replace(/\s/g, "").match(/-?\d+/);
  return match ? Number(match[0]) : null;
}

function cleanText(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Tente de récupérer la page et d'en extraire les données.
 * @throws si la requête réseau échoue (→ 502 côté route).
 */
export async function scrapeSpordleMatch(
  url: string,
): Promise<SpordleMatchData> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (FutsalContentGenerator)" },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Spordle a répondu ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // --- Équipes ---
  // Sélecteurs heuristiques (data-attributes Spordle puis fallback générique).
  const teamNodes = $(
    "[data-testid='team-name'], .team-name, .match-team__name",
  );
  const equipe_dom = cleanText(teamNodes.eq(0).text());
  const equipe_ext = cleanText(teamNodes.eq(1).text());

  // --- Scores ---
  const scoreNodes = $(
    "[data-testid='team-score'], .team-score, .match-team__score",
  );
  const score_dom = parseScore(scoreNodes.eq(0).text());
  const score_ext = parseScore(scoreNodes.eq(1).text());

  // --- Logos ---
  const logoNodes = $(
    "[data-testid='team-logo'] img, .team-logo img, img.match-team__logo",
  );
  const resolveSrc = (i: number): string | null => {
    const el = logoNodes.eq(i);
    const src = el.attr("src") ?? el.attr("data-src");
    if (!src) return null;
    try {
      return new URL(src, url).toString();
    } catch {
      return src;
    }
  };
  const logo_dom = resolveSrc(0);
  const logo_ext = resolveSrc(1);

  // --- Date ---
  const dateRaw =
    $("time").attr("datetime") ??
    cleanText($("[data-testid='match-date'], .match-date").first().text());
  const date = dateRaw ? dateRaw : null;

  // --- Buteurs ---
  const buteurs: SpordleScorer[] = [];
  $("[data-testid='scorer'], .scorer, .goal-event").each((_, el) => {
    const node = $(el);
    const nom = cleanText(node.find(".scorer-name, [data-testid='scorer-name']").text() || node.text());
    if (!nom) return;
    const side =
      node.attr("data-team") === "away" || node.hasClass("away") ? "ext" : "dom";
    const buts = parseScore(node.find(".scorer-goals").text()) ?? 1;
    buteurs.push({ nom, equipe: side as "dom" | "ext", buts });
  });

  return {
    equipe_dom,
    equipe_ext,
    score_dom,
    score_ext,
    logo_dom,
    logo_ext,
    date,
    buteurs,
  };
}
