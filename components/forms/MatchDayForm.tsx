"use client";

import { LogoUploader } from "@/components/LogoUploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { MatchDayData, TemplateFormProps } from "@/lib/templates/types";

export function MatchDayForm({ data, onChange }: TemplateFormProps<MatchDayData>) {
  const updateTeam = (
    side: "teamA" | "teamB",
    patch: Partial<MatchDayData["teamA"]>,
  ) => {
    onChange({ ...data, [side]: { ...data[side], ...patch } });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Label htmlFor="matchday">Journée</Label>
        <Input
          id="matchday"
          value={data.matchday}
          onChange={(e) => onChange({ ...data, matchday: e.target.value })}
        />
        <Label htmlFor="dateTime">Date et heure</Label>
        <Input
          id="dateTime"
          value={data.dateTime}
          onChange={(e) => onChange({ ...data, dateTime: e.target.value })}
        />
        <Label htmlFor="venue">Lieu</Label>
        <Input
          id="venue"
          value={data.venue}
          onChange={(e) => onChange({ ...data, venue: e.target.value })}
        />
      </div>

      <Separator />

      <TeamBlock
        title="Équipe A"
        name={data.teamA.name}
        logo={data.teamA.logo}
        onName={(name) => updateTeam("teamA", { name })}
        onLogo={(logo) => updateTeam("teamA", { logo })}
      />

      <TeamBlock
        title="Équipe B"
        name={data.teamB.name}
        logo={data.teamB.logo}
        onName={(name) => updateTeam("teamB", { name })}
        onLogo={(logo) => updateTeam("teamB", { logo })}
      />
    </div>
  );
}

function TeamBlock({
  title,
  name,
  logo,
  onName,
  onLogo,
}: {
  title: string;
  name: string;
  logo: string | null;
  onName: (name: string) => void;
  onLogo: (logo: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="flex flex-col gap-2">
        <Label>Nom</Label>
        <Input value={name} onChange={(e) => onName(e.target.value)} />
      </div>
      <LogoUploader label="Logo" value={logo} onChange={onLogo} />
    </div>
  );
}
