"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { exportNode } from "@/lib/export";

type ExportButtonProps = {
  targetRef: React.RefObject<HTMLDivElement | null>;
  filename: string;
};

export function ExportButton({ targetRef, filename }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    const node = targetRef.current;
    if (!node) {
      setError("Aperçu introuvable. Rechargez la page.");
      return;
    }

    setError(null);
    setExporting(true);
    try {
      await exportNode(node, filename);
    } catch (err) {
      console.error("Export PNG failed:", err);
      setError(
        "Export impossible — vérifiez les images (URL externe) ou réessayez.",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" onClick={handleExport} disabled={exporting}>
        {exporting ? "Export en cours…" : "Télécharger PNG (1080×1350)"}
      </Button>
      {error ? (
        <p className="max-w-xs text-right text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
