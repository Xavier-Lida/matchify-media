"use client";

import { useState } from "react";
import { uploadImageFile } from "@/lib/upload-image";
import type {
  Field,
  FieldValues,
  ImageField,
  ListField,
  ListItem,
} from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors";

export function SampleValuesForm({
  fields,
  values,
  onChange,
}: {
  fields: Field[];
  values: FieldValues;
  onChange: (values: FieldValues) => void;
}) {
  if (fields.length === 0) {
    return (
      <p className="text-sm text-muted">
        Ajoutez des champs pour définir les valeurs d&apos;exemple.
      </p>
    );
  }

  const setScalar = (key: string, value: string) =>
    onChange({ ...values, [key]: value });

  const setListItem = (
    field: ListField,
    index: number,
    subKey: string,
    val: string,
  ) => {
    const raw = values[field.key];
    const items: ListItem[] = Array.isArray(raw) ? [...(raw as ListItem[])] : [];
    while (items.length <= index) items.push({});
    const row: ListItem = { ...items[index] };
    row[subKey] = val;
    items[index] = row;
    onChange({ ...values, [field.key]: items });
  };

  const addListRow = (field: ListField) => {
    const raw = values[field.key];
    const items: ListItem[] = Array.isArray(raw) ? [...(raw as ListItem[])] : [];
    if (items.length >= field.maxItems) return;
    onChange({ ...values, [field.key]: [...items, {}] });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold">Valeurs d&apos;exemple</h3>
      <p className="text-xs text-muted">
        Utilisées pour générer l&apos;aperçu automatiquement à la sauvegarde.
      </p>
      <div className="space-y-3">
        {fields
          .filter((field) => field.type !== "shape")
          .map((field) => (
          <div key={field.key} className="space-y-1">
            <label className="text-sm font-medium">
              {field.label}
              <span className="ml-1 text-xs text-muted">({field.key})</span>
            </label>
            {field.type === "text" || field.type === "number" ? (
              <input
                type={field.type === "number" ? "number" : "text"}
                className={inputClass}
                value={
                  typeof values[field.key] === "string" ||
                  typeof values[field.key] === "number"
                    ? String(values[field.key])
                    : ""
                }
                onChange={(e) => setScalar(field.key, e.target.value)}
                placeholder={field.label}
              />
            ) : null}
            {field.type === "image" ? (
              <ImageSampleInput
                field={field}
                value={
                  typeof values[field.key] === "string"
                    ? (values[field.key] as string)
                    : ""
                }
                onChange={(v) => setScalar(field.key, v)}
              />
            ) : null}
            {field.type === "list" ? (
              <ListSampleInput
                field={field}
                values={values}
                onItemChange={setListItem}
                onAddRow={addListRow}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageSampleInput({
  field,
  value,
  onChange,
}: {
  field: ImageField;
  value: string;
  onChange: (v: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const layerLabel =
    field.layer === "background" ? "Photo de fond" : "Image (premier plan)";

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      onChange(await uploadImageFile(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1">
      <span className="text-xs text-muted">{layerLabel}</span>
      <div className="flex gap-2">
        <input
          type="text"
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL https://…"
        />
        <label
          className={`shrink-0 cursor-pointer rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm hover:border-accent ${uploading ? "opacity-50" : ""}`}
        >
          {uploading ? "…" : "Fichier"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </label>
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

function ListSampleInput({
  field,
  values,
  onItemChange,
  onAddRow,
}: {
  field: ListField;
  values: FieldValues;
  onItemChange: (
    field: ListField,
    index: number,
    subKey: string,
    val: string,
  ) => void;
  onAddRow: (field: ListField) => void;
}) {
  const raw = values[field.key];
  const items = Array.isArray(raw) ? raw : [];

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={index}
          className="grid gap-2 rounded-md border border-border bg-surface-2 p-2 sm:grid-cols-2"
        >
          {field.subfields.map((sub) => (
            <div key={sub.key} className="space-y-0.5">
              <span className="text-[11px] text-muted">{sub.label}</span>
              <input
                type={sub.type === "number" ? "number" : "text"}
                className="w-full rounded border border-border bg-surface px-2 py-1 text-sm"
                value={
                  typeof (item as Record<string, unknown>)[sub.key] ===
                    "string" ||
                  typeof (item as Record<string, unknown>)[sub.key] ===
                    "number"
                    ? String((item as Record<string, string | number>)[sub.key])
                    : ""
                }
                onChange={(e) =>
                  onItemChange(field, index, sub.key, e.target.value)
                }
              />
            </div>
          ))}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onAddRow(field)}
        disabled={items.length >= field.maxItems}
        className="text-xs text-muted hover:text-foreground disabled:opacity-40"
      >
        + Ligne ({items.length}/{field.maxItems})
      </button>
    </div>
  );
}
