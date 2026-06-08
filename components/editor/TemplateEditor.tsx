"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type Konva from "konva";
import { useElementWidth } from "@/lib/hooks/use-element-width";
import { PhotoBankPicker } from "./PhotoBankPicker";
import type { PhotoAsset } from "./PhotoBankPicker";
import { ExportGate } from "./ExportGate";
import { HtmlDataForm } from "./HtmlDataForm";
import { DataSelectionStep } from "./DataSelectionStep";
import { buildLayeredRenderPlan } from "@/lib/canvas";
import {
  leagueDataToFieldValues,
  resolveFieldValuesFromSelections,
  buildHtmlDataFromSelections,
  matchToFieldValues,
  teamToFieldValues,
  pickLastMatch,
  pickNextMatch,
} from "@/lib/editor/league-prefill";
import type { DataSelections } from "@/lib/editor/league-prefill";
import { recordExportEvent } from "@/lib/editor/record-export";
import {
  buildTemplateData,
  embedBlobUrls,
  initialHtmlFormValues,
  injectDataIntoHtml,
  injectLivePreviewSupport,
} from "@/lib/html-template";
import type { LeagueMatchEntry, LeagueTeamEntry } from "@/lib/types-user";
import type {
  DataRequirement,
  FieldDataSource,
  FieldValues,
  HtmlFormValues,
  JsonConfig,
  StyleOverrides,
  Template,
} from "@/lib/types";

const CanvasEditor = dynamic(() => import("./CanvasEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-border bg-surface-2 text-muted">
      Chargement de l&apos;éditeur…
    </div>
  ),
});

const INTERACTIVE_REQ_TYPES = new Set(["match_pick", "team_pick", "results_pick"]);

// Logo dataSources — auto-filled from standings, not from photo bank
const LOGO_SOURCES = new Set<FieldDataSource>([
  "match.home_logo",
  "match.visitor_logo",
  "team.logo",
  "league.logo",
]);

// ─── Auto-selection helpers ───────────────────────────────────────────────────

function buildAutoSelections(
  requirements: DataRequirement[],
  schedule: LeagueMatchEntry[],
  standings: LeagueTeamEntry[],
): DataSelections {
  const sels: DataSelections = {};
  for (const req of requirements) {
    if (req.type === "last_match" || req.type === "match_pick") {
      sels[req.id] = pickLastMatch(schedule) ?? null;
    } else if (req.type === "next_match") {
      sels[req.id] = pickNextMatch(schedule) ?? null;
    } else if (req.type === "team_pick") {
      sels[req.id] = standings[0] ?? null;
    } else if (req.type === "results_pick") {
      const played = schedule.filter((m) => m.result?.match(/\d/));
      sels[req.id] = played.slice(-(req.maxItems ?? played.length));
    }
  }
  return sels;
}

function buildInitialValues(
  config: JsonConfig,
  leagueData?: Record<string, unknown>,
  photoValues: Record<string, string> = {},
): FieldValues {
  const base: FieldValues = {};
  for (const field of config.fields) {
    if (field.type === "shape") continue;
    base[field.key] = field.type === "list" ? [] : "";
  }

  if (!leagueData) return { ...base, ...photoValues };

  const fromLeague = leagueDataToFieldValues(leagueData, config);
  const schedule = Array.isArray(leagueData.schedule)
    ? (leagueData.schedule as LeagueMatchEntry[])
    : [];
  const standings = Array.isArray(leagueData.standings)
    ? (leagueData.standings as LeagueTeamEntry[])
    : [];
  const logoByTeam = new Map(standings.map((t) => [t.name, t.logo]));
  const requirements = config.requirements ?? [];
  const pickSels = buildAutoSelections(requirements, schedule, standings);
  const fromPick = resolveFieldValuesFromSelections(
    config,
    pickSels,
    logoByTeam,
    standings,
    leagueData,
  );

  return { ...base, ...fromLeague, ...fromPick, ...photoValues };
}

// ─── Canvas template editor ───────────────────────────────────────────────────

function CanvasExportEditor({
  template,
  leagueData,
  assets,
}: {
  template: Template;
  leagueData?: Record<string, unknown>;
  assets: PhotoAsset[];
}) {
  const config = template.json_config;
  const requirements = config.requirements ?? [];
  const schedule = Array.isArray(leagueData?.schedule)
    ? (leagueData!.schedule as LeagueMatchEntry[])
    : [];
  const standings = Array.isArray(leagueData?.standings)
    ? (leagueData!.standings as LeagueTeamEntry[])
    : [];

  const needsSelection = requirements.some((r) =>
    INTERACTIVE_REQ_TYPES.has(r.type),
  );

  const photoBankFields = config.fields.filter(
    (f) =>
      f.type === "image" &&
      !LOGO_SOURCES.has(f.dataSource as FieldDataSource),
  );

  const userEditableFields = config.fields.filter(
    (f) => f.userEditable && (f.type === "text" || f.type === "number"),
  );

  const [phase, setPhase] = useState<"select" | "export">(
    needsSelection ? "select" : "export",
  );
  const [photoValues, setPhotoValues] = useState<Record<string, string>>({});
  const [extraValues, setExtraValues] = useState<FieldValues>({});
  const [userValues, setUserValues] = useState<Record<string, string>>(
    () => Object.fromEntries(userEditableFields.map((f) => [f.key, ""])),
  );
  const overrides = useMemo<StyleOverrides>(() => ({}), []);

  const values = useMemo(
    () => ({ ...buildInitialValues(config, leagueData, photoValues), ...extraValues, ...userValues }),
    [config, leagueData, photoValues, extraValues, userValues],
  );

  const layeredPlan = useMemo(
    () => buildLayeredRenderPlan(config, values, overrides),
    [config, values, overrides],
  );

  const stageRef = useRef<Konva.Stage | null>(null);

  const handleSelectionConfirm = (selections: DataSelections) => {
    const logoByTeam = new Map(standings.map((t) => [t.name, t.logo]));
    let extra: FieldValues = {};
    for (const req of requirements) {
      const sel = selections[req.id];
      if (!sel) continue;
      if (["match_pick", "last_match", "next_match"].includes(req.type) && "home" in sel) {
        extra = { ...extra, ...matchToFieldValues(sel as LeagueMatchEntry, logoByTeam, config) };
      }
      if (req.type === "team_pick" && "name" in sel && !("home" in sel)) {
        const pos = standings.indexOf(sel as LeagueTeamEntry) + 1;
        extra = { ...extra, ...teamToFieldValues(sel as LeagueTeamEntry, pos, config) };
      }
    }
    const fromDataSource = resolveFieldValuesFromSelections(
      config, selections, logoByTeam, standings, leagueData ?? {},
    );
    setExtraValues({ ...extra, ...fromDataSource });
    setPhase("export");
  };

  const download = (format: "png" | "jpeg") => {
    const stage = stageRef.current;
    if (!stage) return;
    const pixelRatio = config.canvasWidth / stage.width();
    const dataUrl = stage.toDataURL({
      mimeType: format === "png" ? "image/png" : "image/jpeg",
      quality: format === "jpeg" ? 0.92 : 1,
      pixelRatio,
    });
    const link = document.createElement("a");
    const slug = template.nom.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    link.download = `${slug}-${Date.now()}.${format === "png" ? "png" : "jpg"}`;
    link.href = dataUrl;
    link.click();
    void recordExportEvent({
      templateId: template.id,
      templateName: template.nom,
      format: format === "png" ? "png" : "jpeg",
    });
  };

  if (phase === "select") {
    return (
      <DataSelectionStep
        requirements={requirements}
        schedule={schedule}
        standings={standings}
        onConfirm={handleSelectionConfirm}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,340px)_1fr] items-start">
      <CanvasEditor
        config={config}
        pngUrl={template.png_url}
        layeredPlan={layeredPlan}
        stageRef={stageRef}
      />
      <aside className="space-y-4">
        {userEditableFields.map((field) => (
          <div key={field.key} className="space-y-1">
            <label className="text-sm font-medium">{field.label}</label>
            <input
              type={field.type === "number" ? "number" : "text"}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
              value={userValues[field.key] ?? ""}
              onChange={(e) =>
                setUserValues((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
            />
          </div>
        ))}
        {photoBankFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <p className="text-sm font-medium">{field.label}</p>
            <PhotoBankPicker
              assets={assets}
              value={photoValues[field.key] ?? ""}
              onChange={(url) =>
                setPhotoValues((prev) => ({ ...prev, [field.key]: url }))
              }
            />
          </div>
        ))}
        <ExportGate loginHref={`/login?next=/template/${template.id}`}>
          {({ canExport }) => (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => download("png")}
                disabled={!canExport}
                className="w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-40"
              >
                ↓ Exporter PNG
              </button>
              <button
                type="button"
                onClick={() => download("jpeg")}
                disabled={!canExport}
                className="w-full rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-medium hover:border-accent disabled:opacity-40"
              >
                ↓ Exporter JPG
              </button>
            </div>
          )}
        </ExportGate>
        {needsSelection && (
          <button
            type="button"
            onClick={() => setPhase("select")}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm text-muted hover:border-primary/40 hover:text-foreground transition-colors"
          >
            ← Modifier la sélection
          </button>
        )}
      </aside>
    </div>
  );
}

// ─── HTML template editor ─────────────────────────────────────────────────────

function HtmlExportEditor({
  template,
  leagueData,
  assets,
}: {
  template: Template;
  leagueData?: Record<string, unknown>;
  assets: PhotoAsset[];
}) {
  const config = template.json_config;
  const schema = config.htmlSchema!;
  const htmlUrl = config.htmlUrl!;
  const canvasWidth = config.canvasWidth;
  const canvasHeight = config.canvasHeight;

  const imageSections = schema.sections.filter((s) => s.type === "image" && !s.requirementId);
  // Text/number/array/object sections the user can edit manually (images handled separately)
  const manualSchema = {
    sections: schema.sections.filter((s) => s.type !== "image" && !s.requirementId),
  };

  const schedule = Array.isArray(leagueData?.schedule)
    ? (leagueData!.schedule as LeagueMatchEntry[])
    : [];
  const standings = Array.isArray(leagueData?.standings)
    ? (leagueData!.standings as LeagueTeamEntry[])
    : [];
  const requirements = config.requirements ?? [];

  const needsSelection = requirements.some((r) =>
    INTERACTIVE_REQ_TYPES.has(r.type),
  );
  const [phase, setPhase] = useState<"select" | "export">(
    needsSelection ? "select" : "export",
  );
  const [selections, setSelections] = useState<DataSelections>({});

  const autoData = useMemo(() => {
    const autoSels = buildAutoSelections(requirements, schedule, standings);
    return buildHtmlDataFromSelections(
      requirements,
      { ...autoSels, ...selections },
      standings,
      schedule,
      leagueData,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueData, selections]);

  const mergedDefaults = useMemo(
    () => ({ ...config.htmlDefaultData, ...leagueData, ...autoData }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leagueData, autoData],
  );

  const [values, setValues] = useState<HtmlFormValues>(() =>
    initialHtmlFormValues(schema, mergedDefaults),
  );

  // Re-sync values when selections change
  useEffect(() => {
    setValues(initialHtmlFormValues(schema, mergedDefaults));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergedDefaults]);

  const templateData = useMemo(
    () => buildTemplateData(schema, values),
    [schema, values],
  );

  const [htmlSource, setHtmlSource] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(htmlUrl)
      .then((r) => r.text())
      .then((text) => { if (!cancelled) setHtmlSource(text); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [htmlUrl]);

  // Live preview via iframe + postMessage
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [wrapperRef, wrapperWidth] = useElementWidth();
  const scale = wrapperWidth > 0 ? wrapperWidth / canvasWidth : 0;

  const previewSrcdoc = useMemo(() => {
    if (!htmlSource) return null;
    const emptyData = buildTemplateData(schema, initialHtmlFormValues(schema, config.htmlDefaultData));
    return injectLivePreviewSupport(injectDataIntoHtml(htmlSource, emptyData));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlSource]);

  const sendToIframe = useCallback((data: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage({ type: "TEMPLATE_UPDATE", data }, "*");
  }, []);

  useEffect(() => {
    sendToIframe(templateData);
  }, [templateData, sendToIframe]);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportPng = useCallback(async () => {
    if (!htmlSource) return;
    setExporting(true);
    setExportError(null);
    try {
      const embeddedData = await embedBlobUrls(templateData);
      const html = injectDataIntoHtml(htmlSource, embeddedData);
      const res = await fetch("/api/export-png", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, width: canvasWidth, height: canvasHeight }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Export échoué" }));
        throw new Error(body.error ?? "Export échoué");
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
  }, [htmlSource, templateData, canvasWidth, canvasHeight, template.nom, template.id]);

  if (phase === "select") {
    return (
      <DataSelectionStep
        requirements={requirements}
        schedule={schedule}
        standings={standings}
        onConfirm={(sel) => {
          setSelections(sel);
          setPhase("export");
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,340px)_1fr] items-start">
      <div
        ref={wrapperRef}
        className="relative w-full overflow-hidden rounded-xl border border-border bg-black"
        style={{
          height: scale > 0 ? Math.round(wrapperWidth * canvasHeight / canvasWidth) : 160,
        }}
      >
        {!previewSrcdoc || scale === 0 ? (
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
              onLoad={() => sendToIframe(templateData)}
            />
          </div>
        )}
      </div>
      <aside className="space-y-4">
        {imageSections.map((section) => (
          <div key={section.key} className="space-y-2">
            <p className="text-sm font-medium">{section.label}</p>
            <PhotoBankPicker
              assets={assets}
              value={(values[section.key] as string) ?? ""}
              onChange={(url) =>
                setValues((prev) => ({ ...prev, [section.key]: url }))
              }
            />
          </div>
        ))}
        {manualSchema.sections.length > 0 && (
          <HtmlDataForm
            schema={manualSchema}
            values={values}
            onChange={setValues}
          />
        )}
        {exportError && (
          <p className="text-sm text-destructive">{exportError}</p>
        )}
        <ExportGate loginHref={`/login?next=/template/${template.id}`}>
          {({ canExport }) => (
            <button
              type="button"
              onClick={exportPng}
              disabled={!canExport || exporting || !htmlSource}
              className="w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-40"
            >
              {exporting ? "Export en cours…" : "↓ Exporter PNG"}
            </button>
          )}
        </ExportGate>
        {needsSelection && (
          <button
            type="button"
            onClick={() => setPhase("select")}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm text-muted hover:border-primary/40 hover:text-foreground transition-colors"
          >
            ← Modifier la sélection
          </button>
        )}
      </aside>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TemplateEditor({
  template,
  leagueData,
  assets = [],
  projectId: _projectId,
}: {
  template: Template;
  leagueData?: Record<string, unknown>;
  assets?: PhotoAsset[];
  projectId?: string;
}) {
  const config = template.json_config;

  if (config.templateMode === "html" && config.htmlUrl && config.htmlSchema) {
    return (
      <HtmlExportEditor
        template={template}
        leagueData={leagueData}
        assets={assets}
      />
    );
  }

  return (
    <CanvasExportEditor
      template={template}
      leagueData={leagueData}
      assets={assets}
    />
  );
}
