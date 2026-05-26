"use client";

import { LogoUploader } from "@/components/LogoUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  StandingsData,
  StandingsRow,
  TemplateFormProps,
} from "@/lib/templates/types";

const MAX_ROWS = 8;

export function StandingsForm({
  data,
  onChange,
}: TemplateFormProps<StandingsData>) {
  const updateRow = (index: number, patch: Partial<StandingsRow>) => {
    const rows = data.rows.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    onChange({ ...data, rows });
  };

  const addRow = () => {
    if (data.rows.length >= MAX_ROWS) {
      return;
    }
    const nextRank = data.rows.length + 1;
    onChange({
      ...data,
      rows: [
        ...data.rows,
        {
          rank: nextRank,
          teamName: `Équipe ${nextRank}`,
          logo: null,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          gf: 0,
          ga: 0,
          points: 0,
        },
      ],
    });
  };

  const removeRow = (index: number) => {
    const rows = data.rows
      .filter((_, i) => i !== index)
      .map((row, i) => ({ ...row, rank: i + 1 }));
    onChange({ ...data, rows });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
      </div>

      {data.rows.map((row, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-lg border p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Ligne {row.rank}</span>
            {data.rows.length > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeRow(index)}
              >
                Supprimer
              </Button>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label>Nom</Label>
            <Input
              value={row.teamName}
              onChange={(e) => updateRow(index, { teamName: e.target.value })}
            />
          </div>
          <LogoUploader
            label="Logo"
            value={row.logo}
            onChange={(logo) => updateRow(index, { logo })}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatField
              label="J"
              value={row.played}
              onChange={(played) => updateRow(index, { played })}
            />
            <StatField
              label="V"
              value={row.wins}
              onChange={(wins) => updateRow(index, { wins })}
            />
            <StatField
              label="N"
              value={row.draws}
              onChange={(draws) => updateRow(index, { draws })}
            />
            <StatField
              label="D"
              value={row.losses}
              onChange={(losses) => updateRow(index, { losses })}
            />
            <StatField
              label="BP"
              value={row.gf}
              onChange={(gf) => updateRow(index, { gf })}
            />
            <StatField
              label="BC"
              value={row.ga}
              onChange={(ga) => updateRow(index, { ga })}
            />
            <StatField
              label="Pts"
              value={row.points}
              onChange={(points) => updateRow(index, { points })}
            />
          </div>
        </div>
      ))}

      {data.rows.length < MAX_ROWS ? (
        <Button type="button" variant="outline" onClick={addRow}>
          Ajouter une équipe
        </Button>
      ) : null}
    </div>
  );
}

function StatField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
