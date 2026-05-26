import type { FullTimeScorer } from "@/lib/templates/types";

const GOALS_SUFFIX =
  /(?:\s+x\s*(\d+)|\s*\((\d+)\)|\s+(\d+))\s*$/i;

function parseLine(line: string): FullTimeScorer | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(GOALS_SUFFIX);
  if (!match) {
    return { name: trimmed, goals: 1 };
  }

  const goals = Number(match[1] || match[2] || match[3]);
  const name = trimmed.slice(0, match.index).trim();
  if (!name || !Number.isFinite(goals) || goals < 1) {
    return { name: trimmed, goals: 1 };
  }

  return { name, goals: Math.floor(goals) };
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function parseScorersText(text: string): FullTimeScorer[] {
  const order: string[] = [];
  const byName = new Map<string, FullTimeScorer>();

  for (const line of text.split("\n")) {
    const parsed = parseLine(line);
    if (!parsed) {
      continue;
    }

    const key = normalizeName(parsed.name);
    const existing = byName.get(key);
    if (existing) {
      existing.goals += parsed.goals;
    } else {
      byName.set(key, { name: parsed.name, goals: parsed.goals });
      order.push(key);
    }
  }

  return order.map((key) => byName.get(key)!);
}

export function formatScorersText(scorers: FullTimeScorer[]): string {
  return scorers
    .map((s) => (s.goals > 1 ? `${s.name} x${s.goals}` : s.name))
    .join("\n");
}
