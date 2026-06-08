/**
 * Utilities for HTML/JS-based templates.
 * These templates define their own rendering and receive data via window.TEMPLATE_DATA.
 */

import type {
  HtmlFieldType,
  HtmlFormValues,
  HtmlSchema,
  HtmlSchemaField,
  HtmlSchemaSection,
  HtmlSectionType,
} from "./types";

/**
 * Moteur data-bind universel injecté dans tous les templates HTML.
 * Attributs supportés :
 *   data-bind="path"       → textContent
 *   data-bind-src="path"   → attribut src (img, image-slot)
 *   data-bind-html="path"  → innerHTML
 *   data-bind-each="path"  → itère un tableau ; contenu dans <template>
 *
 * Accès imbriqué : data-bind="brand.name" → TEMPLATE_DATA.brand.name
 * Dans data-bind-each, les chemins sont relatifs à l'item courant.
 */
const DATA_BIND_ENGINE = `/* __data-bind-engine */
(function(){
  function get(o,p){return p?p.split('.').reduce(function(a,k){return a!=null?a[k]:void 0},o):o;}
  function bind(root,ctx){
    root.querySelectorAll('[data-bind]').forEach(function(el){
      var v=get(ctx,el.getAttribute('data-bind'));
      if(v!=null)el.textContent=String(v);
    });
    root.querySelectorAll('[data-bind-src]').forEach(function(el){
      var v=get(ctx,el.getAttribute('data-bind-src'));
      if(v!=null)el.setAttribute('src',String(v));
    });
    root.querySelectorAll('[data-bind-html]').forEach(function(el){
      var v=get(ctx,el.getAttribute('data-bind-html'));
      if(v!=null)el.innerHTML=String(v);
    });
    root.querySelectorAll('[data-bind-each]').forEach(function(container){
      var items=get(ctx,container.getAttribute('data-bind-each'));
      var tmpl=container.querySelector('template');
      if(!Array.isArray(items)||!tmpl)return;
      Array.from(container.children).forEach(function(c){if(c.tagName!=='TEMPLATE')c.remove();});
      items.forEach(function(item){
        var frag=document.importNode(tmpl.content,true);
        var wrap=document.createElement('div');
        wrap.appendChild(frag);
        bind(wrap,item);
        while(wrap.firstChild)container.appendChild(wrap.firstChild);
      });
    });
  }
  window.__renderDataBind=function(){bind(document,window.TEMPLATE_DATA||{});};
})();`.trim();

// Polyfill inlined into srcdoc iframes to replace image-slot.js.
// Matches the real component's export behaviour: background is transparent by
// default — no gray placeholder. The real component only adds a faint gray
// hint when data-editable is set (interactive editor), never in static renders.
const IMAGE_SLOT_POLYFILL = `
customElements.define('image-slot', class extends HTMLElement {
  connectedCallback() { this._r(); }
  static get observedAttributes() { return ['src', 'shape', 'fit', 'radius', 'mask']; }
  attributeChangedCallback(_n, old, next) { if (old !== next) this._r(); }
  _r() {
    this.innerHTML = '';
    const src    = this.getAttribute('src');
    const fit    = this.getAttribute('fit') || 'cover';
    const shape  = this.getAttribute('shape') || 'rounded';
    const radius = this.getAttribute('radius') || '12';
    const mask   = this.getAttribute('mask');
    this.style.display   = 'block';
    this.style.overflow  = 'hidden';
    this.style.position  = 'relative';
    // Apply shape — no background set, let the template CSS take over
    if (mask) {
      this.style.clipPath = mask;
    } else if (shape === 'circle') {
      this.style.borderRadius = '50%';
    } else if (shape === 'pill') {
      this.style.borderRadius = '9999px';
    } else if (shape === 'rounded') {
      this.style.borderRadius = radius + 'px';
    }
    if (src) {
      const img = document.createElement('img');
      img.src = src;
      img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:' + fit + ';display:block;';
      this.appendChild(img);
    }
    // No src → renders transparent/empty, matching the real component's export output
  }
});
`.trim();

function isImageKey(key: string): boolean {
  return /logo|photo|image|img|picture|avatar|banner/i.test(key);
}

// ─── HTML-based schema parser (no data.js needed) ────────────────────────────

function detectHtmlFieldType(key: string): HtmlFieldType {
  const last = key.split(".").pop() ?? key;
  if (/logo|photo|image|img|picture|avatar|banner|flag/i.test(last)) return "image";
  if (/^(pts|pj|v|n|d|bp|bc|diff|position|rang|rank|place|total|count|nb|num|score_home|score_visitor|score_dom|score_ext)$/i.test(last)) return "number";
  return "text";
}

/**
 * Parse an HTML template string and infer the data schema from data-bind-*
 * attributes — no data.js file needed.
 *
 * Pass 1: finds data-bind-each containers → array sections (reads inside <template>).
 * Pass 2: finds data-bind / data-bind-src / data-bind-html NOT inside data-bind-each
 *         → scalar sections (single key) or object sections (dotted key grouped by prefix).
 */
export function parseHtmlSchema(html: string): HtmlSchema {
  if (typeof DOMParser === "undefined") return { sections: [] };

  const doc = new DOMParser().parseFromString(html, "text/html");
  const sections = new Map<string, HtmlSchemaSection>();

  // Pass 1 — data-bind-each → array sections
  doc.querySelectorAll("[data-bind-each]").forEach((container) => {
    const key = container.getAttribute("data-bind-each");
    if (!key || key.includes(".") || sections.has(key)) return;

    const arrayItem: HtmlSchemaField[] = [];
    const seen = new Set<string>();

    // data-bind-each requires a <template> child; fall back to container itself
    const tmpl = container.querySelector("template");
    const root: Element | DocumentFragment = tmpl ? tmpl.content : container;

    const addItem = (path: string, type: HtmlFieldType) => {
      if (seen.has(path)) return;
      seen.add(path);
      arrayItem.push({ key: path, label: autoLabel(path.split(".").pop() ?? path), type });
    };

    root.querySelectorAll("[data-bind]").forEach((el) => {
      const p = el.getAttribute("data-bind")!;
      addItem(p, detectHtmlFieldType(p));
    });
    root.querySelectorAll("[data-bind-src]").forEach((el) => {
      addItem(el.getAttribute("data-bind-src")!, "image");
    });
    root.querySelectorAll("[data-bind-html]").forEach((el) => {
      const p = el.getAttribute("data-bind-html")!;
      addItem(p, detectHtmlFieldType(p));
    });

    sections.set(key, { key, label: autoLabel(key), type: "array", arrayItem });
  });

  // Pass 2 — scalar / object bindings outside data-bind-each
  // (elements inside <template> are in a DocumentFragment and won't appear here)
  const processAttr = (el: Element, path: string, forceType?: HtmlFieldType) => {
    if (el.closest?.("[data-bind-each]")) return;

    const parts = path.split(".");
    const topKey = parts[0];
    const rest = parts.slice(1).join(".");

    if (!rest) {
      if (!sections.has(topKey)) {
        const t = forceType ?? (detectHtmlFieldType(topKey) === "image" ? "image" : "text");
        sections.set(topKey, { key: topKey, label: autoLabel(topKey), type: t });
      }
    } else {
      if (!sections.has(topKey)) {
        sections.set(topKey, { key: topKey, label: autoLabel(topKey), type: "object", fields: [] });
      }
      const sec = sections.get(topKey)!;
      if (sec.type === "object" && !sec.fields?.some((f) => f.key === rest)) {
        (sec.fields ??= []).push({
          key: rest,
          label: autoLabel(rest.split(".").pop() ?? rest),
          type: forceType ?? detectHtmlFieldType(rest),
        });
      }
    }
  };

  doc.querySelectorAll("[data-bind]").forEach((el) => processAttr(el, el.getAttribute("data-bind")!));
  doc.querySelectorAll("[data-bind-src]").forEach((el) => processAttr(el, el.getAttribute("data-bind-src")!, "image"));
  doc.querySelectorAll("[data-bind-html]").forEach((el) => processAttr(el, el.getAttribute("data-bind-html")!));

  return { sections: [...sections.values()] };
}

function isNumericValue(v: unknown): boolean {
  return typeof v === "number";
}

function autoLabel(key: string): string {
  const last = key.split(".").pop() ?? key;
  return last
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function flattenObjectFields(
  obj: Record<string, unknown>,
  prefix = "",
): HtmlSchemaField[] {
  const fields: HtmlSchemaField[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      fields.push(...flattenObjectFields(value as Record<string, unknown>, fullKey));
    } else {
      let type: HtmlFieldType = "text";
      if (isImageKey(key)) type = "image";
      else if (isNumericValue(value)) type = "number";
      fields.push({ key: fullKey, label: autoLabel(key), type });
    }
  }
  return fields;
}

export function buildHtmlSchema(data: Record<string, unknown>): HtmlSchema {
  const sections: HtmlSchemaSection[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      const firstItem = value[0];
      const arrayItem: HtmlSchemaField[] =
        firstItem && typeof firstItem === "object"
          ? flattenObjectFields(firstItem as Record<string, unknown>)
          : [{ key: "value", label: "Valeur", type: "text" }];
      sections.push({ key, label: autoLabel(key), type: "array", arrayItem });
    } else if (value !== null && typeof value === "object") {
      const fields = flattenObjectFields(value as Record<string, unknown>);
      sections.push({ key, label: autoLabel(key), type: "object", fields });
    } else {
      let type: HtmlSectionType = "text";
      if (isImageKey(key)) type = "image";
      else if (isNumericValue(value)) type = "number";
      sections.push({ key, label: autoLabel(key), type });
    }
  }

  return { sections };
}

/** Parse the content of a data.js file and extract TEMPLATE_DATA (client-side only). */
export function parseDataJs(content: string): Record<string, unknown> | null {
  try {
    const captured: { value: Record<string, unknown> | null } = { value: null };
    const proxy = new Proxy(
      {} as Record<string | symbol, unknown>,
      {
        set(_target, prop, value) {
          if (prop === "TEMPLATE_DATA")
            captured.value = value as Record<string, unknown>;
          return true;
        },
      },
    );
    // eslint-disable-next-line no-new-func
    new Function("window", content)(proxy);
    return captured.value;
  } catch {
    return null;
  }
}

function setDeep(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== "object" || cur[parts[i]] === null) {
      cur[parts[i]] = {};
    }
    cur = cur[parts[i]] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

export function buildTemplateData(
  schema: HtmlSchema,
  values: HtmlFormValues,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const section of schema.sections) {
    switch (section.type) {
      case "text":
      case "image":
      case "number":
        data[section.key] = values[section.key] ?? "";
        break;
      case "object": {
        const obj: Record<string, unknown> = {};
        for (const field of section.fields ?? []) {
          setDeep(obj, field.key, values[`${section.key}.${field.key}`] ?? "");
        }
        data[section.key] = obj;
        break;
      }
      case "array": {
        const rows =
          (values[section.key] as Array<Record<string, string>> | undefined) ?? [];
        const typeByKey = new Map(
          (section.arrayItem ?? []).map((f) => [f.key, f.type]),
        );
        data[section.key] = rows.map((row) => {
          const item: Record<string, unknown> = {};
          // Pass ALL string properties from the row (not just schema-defined ones)
          // so leagueData fields like `logo` flow through even if absent from arrayItem.
          for (const [k, raw] of Object.entries(row)) {
            const t = typeByKey.get(k);
            setDeep(item, k, t === "number" ? (raw === "" ? 0 : Number(raw)) : raw);
          }
          return item;
        });
        break;
      }
    }
  }

  return data;
}

export function injectDataIntoHtml(
  htmlSource: string,
  templateData: Record<string, unknown>,
): string {
  let html = htmlSource;

  html = html.replace(
    /<script\b[^>]*\bsrc=["']image-slot\.js["'][^>]*>\s*<\/script>/gi,
    `<script>${IMAGE_SLOT_POLYFILL}</script>`,
  );

  html = html.replace(
    /<script\b[^>]*\bsrc=["']data\.js["'][^>]*>\s*<\/script>/gi,
    `<script>window.TEMPLATE_DATA = ${JSON.stringify(templateData)};</script>\n<script>${DATA_BIND_ENGINE}</script>`,
  );

  return html;
}

/**
 * Wrap the template's rendering script so it can be re-called via postMessage.
 * After this, the iframe accepts { type: 'TEMPLATE_UPDATE', data: {...} } messages
 * and re-renders without a full page reload.
 *
 * Strategy: find the LAST non-trivial inline <script> (the template IIFE),
 * wrap it in function __render(){...}, call it once, then listen for messages.
 */
export function injectLivePreviewSupport(html: string): string {
  // Locate the last inline <script> that is the template's rendering code.
  // Exclude: our data injection, our polyfill, and tiny helper scripts.
  const pattern = /<script(?!\s[^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
  let last: { start: number; end: number; body: string } | null = null;
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(html)) !== null) {
    const body = m[1];
    if (
      body.includes("window.TEMPLATE_DATA =") ||  // our data injection
      body.includes("customElements.define") ||   // our polyfill
      body.includes("__data-bind-engine") ||      // our data-bind engine
      body.includes("html2canvas") ||             // export capture script
      body.includes("HTML_EXPORT") ||
      body.trim().length < 60
    ) continue;
    last = { start: m.index, end: m.index + m[0].length, body };
  }

  const dataBind = `if(window.__renderDataBind)window.__renderDataBind();`;

  const listener = `
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'TEMPLATE_UPDATE') {
    window.TEMPLATE_DATA = e.data.data;
    try { __render(); } catch(_) {}
  }
});`;

  if (!last) {
    // Pas de script custom — le moteur data-bind suffit.
    return html.replace(/<\/body>/i, `<script>function __render(){${dataBind}}\n__render();${listener}</script></body>`);
  }

  // Wrap the original IIFE in __render so it can be re-called.
  // data-bind est appelé en premier ; le script custom peut ensuite affiner.
  const wrapped = `<script>
function __render() {
${dataBind}
${last.body}
}
__render();
${listener}
</script>`;

  return html.slice(0, last.start) + wrapped + html.slice(last.end);
}

/**
 * Convert all blob: URLs found anywhere in the data object into
 * base64 data: URLs so they survive a file download.
 * Runs client-side only (uses fetch + FileReader).
 */
export async function embedBlobUrls(
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const json = JSON.stringify(data);
  const uniqueBlobs = [
    ...new Set([...json.matchAll(/"(blob:[^"]+)"/g)].map((m) => m[1])),
  ];
  if (uniqueBlobs.length === 0) return data;

  const entries = await Promise.all(
    uniqueBlobs.map(async (blobUrl) => {
      try {
        const resp = await fetch(blobUrl);
        const blob = await resp.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        return [blobUrl, dataUrl] as const;
      } catch {
        return [blobUrl, blobUrl] as const;
      }
    }),
  );

  let result = json;
  for (const [blob, dataUrl] of entries) {
    result = result.split(blob).join(dataUrl);
  }
  return JSON.parse(result) as Record<string, unknown>;
}


export function initialHtmlFormValues(
  schema: HtmlSchema,
  defaults?: Record<string, unknown>,
): HtmlFormValues {
  const values: HtmlFormValues = {};

  function getDeep(obj: unknown, path: string): unknown {
    return path.split(".").reduce<unknown>((cur, key) => {
      return cur !== null && typeof cur === "object"
        ? (cur as Record<string, unknown>)[key]
        : undefined;
    }, obj);
  }

  for (const section of schema.sections) {
    switch (section.type) {
      case "text":
      case "image":
      case "number": {
        const def = defaults?.[section.key];
        values[section.key] =
          typeof def === "string" || typeof def === "number" ? String(def) : "";
        break;
      }
      case "object": {
        const obj = defaults?.[section.key];
        for (const field of section.fields ?? []) {
          const flat = `${section.key}.${field.key}`;
          const def = obj ? getDeep(obj, field.key) : undefined;
          values[flat] =
            typeof def === "string" || typeof def === "number"
              ? String(def)
              : "";
        }
        break;
      }
      case "array": {
        const arr = defaults?.[section.key];
        if (Array.isArray(arr) && arr.length > 0) {
          values[section.key] = arr.map((item) => {
            const row: Record<string, string> = {};
            // Pass ALL string/number properties from the source item so that
            // leagueData fields (e.g. `logo`) flow through even if the schema
            // arrayItem was never updated to list them explicitly.
            if (item !== null && typeof item === "object") {
              for (const [k, v] of Object.entries(
                item as Record<string, unknown>,
              )) {
                if (typeof v === "string" || typeof v === "number") {
                  row[k] = String(v);
                }
              }
            }
            // Schema-defined fields: re-apply to enforce type and handle nested paths.
            for (const field of section.arrayItem ?? []) {
              const def = getDeep(item, field.key);
              row[field.key] =
                typeof def === "string" || typeof def === "number"
                  ? String(def)
                  : row[field.key] ?? "";
            }
            return row;
          });
        } else {
          values[section.key] = [];
        }
        break;
      }
    }
  }

  return values;
}

/** Build an empty array item row from arrayItem schema. */
export function emptyArrayItem(
  fields: HtmlSchemaField[],
): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.key, ""]));
}
