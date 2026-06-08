"use client";

import { useRef, useState } from "react";
import { emptyArrayItem } from "@/lib/html-template";
import type {
  HtmlFormValues,
  HtmlSchema,
  HtmlSchemaField,
  HtmlSchemaSection,
} from "@/lib/types";

interface Props {
  schema: HtmlSchema;
  values: HtmlFormValues;
  onChange: (values: HtmlFormValues) => void;
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent";

export function HtmlDataForm({ schema, values, onChange }: Props) {
  const set = (key: string, value: HtmlFormValues[string]) =>
    onChange({ ...values, [key]: value });

  // Sections bound to a requirement are auto-populated — hide from manual form
  const manualSections = schema.sections.filter((s) => !s.requirementId);

  if (manualSections.length === 0) {
    return (
      <p className="text-sm text-muted">
        Toutes les données sont remplies automatiquement depuis la ligue.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {manualSections.map((section) => (
        <SectionField
          key={section.key}
          section={section}
          values={values}
          onSet={set}
        />
      ))}
    </div>
  );
}

function SectionField({
  section,
  values,
  onSet,
}: {
  section: HtmlSchemaSection;
  values: HtmlFormValues;
  onSet: (key: string, value: HtmlFormValues[string]) => void;
}) {
  switch (section.type) {
    case "text":
    case "number":
      return (
        <ScalarField
          label={section.label}
          fieldKey={section.key}
          type={section.type}
          value={(values[section.key] as string) ?? ""}
          onChange={(v) => onSet(section.key, v)}
        />
      );
    case "image":
      return (
        <ImageField
          label={section.label}
          fieldKey={section.key}
          value={(values[section.key] as string) ?? ""}
          onChange={(v) => onSet(section.key, v)}
        />
      );
    case "object":
      return (
        <ObjectSection
          section={section}
          values={values}
          onSet={onSet}
        />
      );
    case "array":
      return (
        <ArraySection
          section={section}
          rows={(values[section.key] as Array<Record<string, string>>) ?? []}
          onChange={(rows) => onSet(section.key, rows)}
        />
      );
    default:
      return null;
  }
}

function ScalarField({
  label,
  fieldKey,
  type,
  value,
  onChange,
}: {
  label: string;
  fieldKey: string;
  type: "text" | "number";
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={fieldKey} className="text-sm font-medium">{label}</label>
      <input
        id={fieldKey}
        type={type}
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ImageField({
  label,
  fieldKey,
  value,
  onChange,
}: {
  label: string;
  fieldKey: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);

  const onFile = (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") onChange(reader.result);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1">
      <label htmlFor={fieldKey} className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <input
          id={fieldKey}
          type="text"
          placeholder="URL de l'image…"
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs hover:border-accent disabled:opacity-50"
        >
          {loading ? "…" : "Parcourir"}
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
    </div>
  );
}

function ObjectSection({
  section,
  values,
  onSet,
}: {
  section: HtmlSchemaSection;
  values: HtmlFormValues;
  onSet: (key: string, value: HtmlFormValues[string]) => void;
}) {
  return (
    <fieldset className="rounded-lg border border-border p-4 space-y-3">
      <legend className="px-1 text-sm font-medium">{section.label}</legend>
      {(section.fields ?? []).map((field) => (
        <SubField
          key={field.key}
          field={field}
          flatKey={`${section.key}.${field.key}`}
          value={(values[`${section.key}.${field.key}`] as string) ?? ""}
          onChange={(v) => onSet(`${section.key}.${field.key}`, v)}
        />
      ))}
    </fieldset>
  );
}

function SubField({
  field,
  flatKey,
  value,
  onChange,
}: {
  field: HtmlSchemaField;
  flatKey: string;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.type === "image") {
    return <ImageField label={field.label} fieldKey={flatKey} value={value} onChange={onChange} />;
  }
  return (
    <ScalarField
      label={field.label}
      fieldKey={flatKey}
      type={field.type === "number" ? "number" : "text"}
      value={value}
      onChange={onChange}
    />
  );
}

function ArraySection({
  section,
  rows,
  onChange,
}: {
  section: HtmlSchemaSection;
  rows: Array<Record<string, string>>;
  onChange: (rows: Array<Record<string, string>>) => void;
}) {
  const fields = section.arrayItem ?? [];

  const updateRow = (i: number, key: string, v: string) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r));
    onChange(next);
  };

  const addRow = () => onChange([...rows, emptyArrayItem(fields)]);
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{section.label}</p>
      {rows.map((row, i) => (
        <div key={i} className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Ligne {i + 1}</span>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Supprimer
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {fields.map((field) =>
              field.type === "image" ? (
                <div key={field.key} className="col-span-2">
                  <ImageField
                    label={field.label}
                    fieldKey={`${section.key}.${i}.${field.key}`}
                    value={row[field.key] ?? ""}
                    onChange={(v) => updateRow(i, field.key, v)}
                  />
                </div>
              ) : (
                <div key={field.key}>
                  <label className="text-xs text-muted mb-0.5 block">{field.label}</label>
                  <input
                    type={field.type === "number" ? "number" : "text"}
                    className="w-full rounded border border-border bg-surface-2 px-2 py-1.5 text-xs outline-none focus:border-accent"
                    value={row[field.key] ?? ""}
                    onChange={(e) => updateRow(i, field.key, e.target.value)}
                  />
                </div>
              ),
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted hover:border-accent hover:text-foreground w-full"
      >
        + Ajouter une ligne
      </button>
    </div>
  );
}
