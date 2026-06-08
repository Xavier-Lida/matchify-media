"use client";

import { useState } from "react";
import { TemplateForm } from "./TemplateForm";
import { HtmlTemplateImport } from "./HtmlTemplateImport";

type Mode = "canvas" | "html";

export function TemplateCreator() {
  const [mode, setMode] = useState<Mode>("canvas");

  return (
    <div className="space-y-6">
      <div className="flex gap-2 rounded-lg border border-border bg-surface p-1 w-fit">
        <ModeTab label="Template canvas (JSON)" active={mode === "canvas"} onClick={() => setMode("canvas")} />
        <ModeTab label="Importer HTML/JS" active={mode === "html"} onClick={() => setMode("html")} />
      </div>

      {mode === "canvas" ? (
        <TemplateForm mode="create" />
      ) : (
        <HtmlTemplateImport />
      )}
    </div>
  );
}

function ModeTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
