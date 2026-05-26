import type { ResultData } from "@/lib/design/result-types";
import type { Branding, FullTimeData } from "@/lib/templates/types";

function formatMatchdayLabel(matchday: string): string {
  const trimmed = matchday.trim();
  if (/^matchday\s/i.test(trimmed) || /^journée\s/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  const asNumber = Number(trimmed);
  if (!Number.isNaN(asNumber) && trimmed !== "") {
    return `MATCHDAY ${String(asNumber).padStart(2, "0")}`;
  }
  return trimmed.toUpperCase();
}

export function adaptResultData(
  branding: Branding,
  data: FullTimeData,
): ResultData {
  const matchdayLabel = formatMatchdayLabel(data.matchday);

  return {
    league: {
      name: branding.leagueName,
      division: matchdayLabel,
      season: data.season,
      matchday: data.matchday,
      field_name: data.fieldName,
      logo_url: branding.logoDataUrl,
    },
    date: data.date,
    home: { logo_url: data.teamA.logo },
    away: { logo_url: data.teamB.logo },
    score: [data.scoreA, data.scoreB],
    scorers: {
      home: data.scorersA,
      away: data.scorersB,
    },
    hero_photo: data.heroPhoto,
  };
}
