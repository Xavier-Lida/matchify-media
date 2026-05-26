"use client";

import { useBrandingContext } from "@/components/BrandingProvider";
import { LogoUploader } from "@/components/LogoUploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  formatScorersText,
  parseScorersText,
} from "@/lib/scorers/parse-scorers";
import type { FullTimeData, TemplateFormProps } from "@/lib/templates/types";

export function FullTimeForm({ data, onChange }: TemplateFormProps<FullTimeData>) {
  const { branding, updateBranding } = useBrandingContext();

  const updateTeam = (
    side: "teamA" | "teamB",
    patch: Partial<FullTimeData["teamA"]>,
  ) => {
    onChange({ ...data, [side]: { ...data[side], ...patch } });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold">Couleurs</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="primaryColor">Couleur principale</Label>
            <div className="flex items-center gap-2">
              <Input
                id="primaryColor"
                type="color"
                value={branding.primaryColor}
                onChange={(e) =>
                  updateBranding({ primaryColor: e.target.value })
                }
                className="h-10 w-14 cursor-pointer p-1"
              />
              <Input
                value={branding.primaryColor}
                onChange={(e) =>
                  updateBranding({ primaryColor: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="secondaryColor">Couleur accent</Label>
            <div className="flex items-center gap-2">
              <Input
                id="secondaryColor"
                type="color"
                value={branding.secondaryColor}
                onChange={(e) =>
                  updateBranding({ secondaryColor: e.target.value })
                }
                className="h-10 w-14 cursor-pointer p-1"
              />
              <Input
                value={branding.secondaryColor}
                onChange={(e) =>
                  updateBranding({ secondaryColor: e.target.value })
                }
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Nom de ligue et logo du footer dans{" "}
          <a href="/branding" className="underline">
            Paramètres avancés
          </a>
          .
        </p>
      </div>

      <Separator />

      <LogoUploader
        label="Photo de fond (hero)"
        value={data.heroPhoto}
        onChange={(heroPhoto) => onChange({ ...data, heroPhoto })}
        persistAsDataUrl
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            value={data.date}
            onChange={(e) => onChange({ ...data, date: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="matchday">Journée</Label>
          <Input
            id="matchday"
            value={data.matchday}
            onChange={(e) => onChange({ ...data, matchday: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fieldName">Lieu</Label>
          <Input
            id="fieldName"
            value={data.fieldName}
            onChange={(e) => onChange({ ...data, fieldName: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="season">Saison</Label>
          <Input
            id="season"
            value={data.season}
            onChange={(e) => onChange({ ...data, season: e.target.value })}
          />
        </div>
      </div>

      <Separator />

      <TeamFields
        title="Équipe domicile"
        logo={data.teamA.logo}
        score={data.scoreA}
        scorersText={formatScorersText(data.scorersA)}
        onLogo={(logo) => updateTeam("teamA", { logo })}
        onScore={(scoreA) => onChange({ ...data, scoreA })}
        onScorers={(text) =>
          onChange({ ...data, scorersA: parseScorersText(text) })
        }
      />

      <Separator />

      <TeamFields
        title="Équipe extérieur"
        logo={data.teamB.logo}
        score={data.scoreB}
        scorersText={formatScorersText(data.scorersB)}
        onLogo={(logo) => updateTeam("teamB", { logo })}
        onScore={(scoreB) => onChange({ ...data, scoreB })}
        onScorers={(text) =>
          onChange({ ...data, scorersB: parseScorersText(text) })
        }
      />
    </div>
  );
}

function TeamFields({
  title,
  logo,
  score,
  scorersText,
  onLogo,
  onScore,
  onScorers,
}: {
  title: string;
  logo: string | null;
  score: number;
  scorersText: string;
  onLogo: (logo: string | null) => void;
  onScore: (score: number) => void;
  onScorers: (text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <LogoUploader label="Logo" value={logo} onChange={onLogo} />
      <div className="flex flex-col gap-2">
        <Label>Score</Label>
        <Input
          type="number"
          min={0}
          value={score}
          onChange={(e) => onScore(Number(e.target.value))}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Buteurs (une ligne par joueur ; x2 pour un doublé)</Label>
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          value={scorersText}
          onChange={(e) => onScorers(e.target.value)}
        />
      </div>
    </div>
  );
}
