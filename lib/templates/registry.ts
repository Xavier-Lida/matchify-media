import { FullTimeEditor } from "@/components/editors/FullTimeEditor";
import { MatchDayEditor } from "@/components/editors/MatchDayEditor";
import { StandingsEditor } from "@/components/editors/StandingsEditor";
import type { ComponentType } from "react";
import type { TemplateId } from "@/lib/templates/types";

export type TemplateRegistryEntry = {
  id: TemplateId;
  label: string;
  description: string;
  Editor: ComponentType;
};

export const TEMPLATES = {
  fulltime: {
    id: "fulltime",
    label: "Résultat de match",
    description: "Broadcast Meridian — photo hero, score, logos, buteurs et journée.",
    Editor: FullTimeEditor,
  },
  matchday: {
    id: "matchday",
    label: "Annonce de match",
    description: "Affiche la rencontre à venir avec date, heure et lieu.",
    Editor: MatchDayEditor,
  },
  standings: {
    id: "standings",
    label: "Classement",
    description: "Tableau de la journée avec stats et points (8 équipes max).",
    Editor: StandingsEditor,
  },
} as const satisfies Record<TemplateId, TemplateRegistryEntry>;

export const TEMPLATE_LIST = Object.values(TEMPLATES);

export function getTemplate(id: string) {
  return TEMPLATES[id as TemplateId] ?? null;
}
