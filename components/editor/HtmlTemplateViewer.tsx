"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildTemplateData,
  embedBlobUrls,
  initialHtmlFormValues,
  injectDataIntoHtml,
  injectLivePreviewSupport,
} from "@/lib/html-template";
import { useElementWidth } from "@/lib/hooks/use-element-width";
import { recordExportEvent } from "@/lib/editor/record-export";
import type { HtmlFormValues, Template } from "@/lib/types";
import { ExportGate } from "./ExportGate";
import { HtmlDataForm } from "./HtmlDataForm";

interface Props {
  template: Template;
  leagueData?: Record<string, unknown>;
}

export function HtmlTemplateViewer({ template, leagueData }: Props) {
  const { json_config } = template;
  const schema = json_config.htmlSchema!;
  const htmlUrl = json_config.htmlUrl!;
  const defaults = json_config.htmlDefaultData;
  const canvasWidth = json_config.canvasWidth;
  const canvasHeight = json_config.canvasHeight;

  // Raw HTML source fetched once from Supabase Storage
  const [htmlSource, setHtmlSource] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form values
  const mergedDefaults = useMemo(
    () => ({ ...defaults, ...leagueData }),
    [defaults, leagueData],
  );

  const [values, setValues] = useState<HtmlFormValues>(() =>
    initialHtmlFormValues(schema, mergedDefaults),
  );

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // External CSS scaling
  const [wrapperRef, wrapperWidth] = useElementWidth();
  const scale = wrapperWidth > 0 ? wrapperWidth / canvasWidth : 0;

  // Stable ref to the iframe DOM element
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Build the srcdoc ONCE when htmlSource loads (with live-preview support injected).
  // Data is NOT embedded here — it's sent separately via postMessage so the iframe
  // never needs to reload when form values change.
  const previewSrcdoc = useMemo(() => {
    if (!htmlSource) return null;
    const emptyData = buildTemplateData(schema, initialHtmlFormValues(schema, defaults));
    const injected = injectDataIntoHtml(htmlSource, emptyData);
    return injectLivePreviewSupport(injected);
  }, [htmlSource]); // eslint-disable-line react-hooks/exhaustive-deps

  // Current rendered data (derived from form values)
  const templateData = useMemo(
    () => buildTemplateData(schema, values),
    [schema, values],
  );

  // Send data to the iframe — either on first load or when values change
  const sendDataToIframe = useCallback(
    (data: Record<string, unknown>) => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "TEMPLATE_UPDATE", data },
        "*",
      );
    },
    [],
  );

  // Fetch HTML source from Supabase Storage
  useEffect(() => {
    let cancelled = false;
    fetch(htmlUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => { if (!cancelled) setHtmlSource(text); })
      .catch((err) => {
        if (!cancelled)
          setLoadError(err?.message ?? "Impossible de charger le template HTML.");
      });
    return () => { cancelled = true; };
  }, [htmlUrl]);

  // Push data every time form values change (no iframe remount)
  useEffect(() => {
    sendDataToIframe(templateData);
  }, [templateData, sendDataToIframe]);

  // ── Downloads / Export ──────────────────────────────────────────────────────

  const downloadHtml = useCallback(async () => {
    if (!htmlSource) return;
    // Embed any blob: URLs → data: URLs so images are in the file
    const embeddedData = await embedBlobUrls(templateData);
    const html = injectDataIntoHtml(htmlSource, embeddedData);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.nom.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [htmlSource, templateData, template.nom]);

  const openInTab = useCallback(async () => {
    if (!htmlSource) return;
    const embeddedData = await embedBlobUrls(templateData);
    const html = injectDataIntoHtml(htmlSource, embeddedData);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 15_000);
  }, [htmlSource, templateData]);

  const exportPng = useCallback(async () => {
    if (!htmlSource) return;
    setExporting(true);
    setExportError(null);
    try {
      // Convert any blob: URLs to data: URLs so the server can access them
      const embeddedData = await embedBlobUrls(templateData);
      const html = injectDataIntoHtml(htmlSource, embeddedData);

      const res = await fetch("/api/export-png", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, width: canvasWidth, height: canvasHeight }),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Export échoué" }));
        throw new Error(error ?? "Export échoué");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template.nom.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      void recordExportEvent({
        templateId: template.id,
        templateName: template.nom,
        format: "png",
      });
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export échoué.");
    } finally {
      setExporting(false);
    }
  }, [htmlSource, templateData, canvasWidth, canvasHeight, template.nom]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,340px)_1fr] items-start">
      {/* ── Preview ── */}
      <div className="space-y-4">
        <ExportGate loginHref={`/login?next=/template/${template.id}`}>
          {({ canExport }) => (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportPng}
                disabled={!previewSrcdoc || exporting || !canExport}
                className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-40"
              >
                {exporting ? "Export en cours…" : "↓ Télécharger PNG"}
              </button>
              <button
                type="button"
                onClick={openInTab}
                disabled={!previewSrcdoc}
                className="rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-medium hover:border-accent disabled:opacity-40"
              >
                Ouvrir dans un onglet
              </button>
              <button
                type="button"
                onClick={downloadHtml}
                disabled={!previewSrcdoc || !canExport}
                className="rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-medium hover:border-accent disabled:opacity-40"
              >
                Télécharger HTML
              </button>
            </div>
          )}
        </ExportGate>
        {leagueData ? (
          <p className="text-xs text-muted">
            Données préremplies depuis votre projet.{" "}
            <Link href="/dashboard" className="text-accent hover:underline">
              Mes projets
            </Link>
          </p>
        ) : null}
        {exportError && <p className="text-sm text-red-400">{exportError}</p>}

        <div
          ref={wrapperRef}
          className="w-full overflow-hidden rounded-xl border border-border bg-black relative"
          style={{
            height: scale > 0 ? Math.round(wrapperWidth * canvasHeight / canvasWidth) : 160,
          }}
        >
          {loadError ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-red-400 p-4 text-center">
              {loadError}
            </div>
          ) : !previewSrcdoc || scale === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">
              Chargement…
            </div>
          ) : (
            <div
              style={{
                width: canvasWidth,
                height: canvasHeight,
                transform: `scale(${scale})`,
                transformOrigin: "0 0",
                pointerEvents: "none",
              }}
            >
              <iframe
                ref={iframeRef}
                title={template.nom}
                srcDoc={previewSrcdoc}
                sandbox="allow-scripts"
                style={{ width: canvasWidth, height: canvasHeight, border: 0, display: "block" }}
                onLoad={() => sendDataToIframe(templateData)}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Form ── */}
      <aside>
        <HtmlDataForm schema={schema} values={values} onChange={setValues} />
      </aside>
    </div>
  );
}
