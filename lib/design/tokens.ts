import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/constants";

export type DesignTheme = {
  ink: string;
  inkSoft: string;
  inkLine: string;
  paper: string;
  paperMute: string;
  gold: string;
  goldHi: string;
  red: string;
  green: string;
};

export const DEFAULT_DESIGN_THEME: DesignTheme = {
  ink: "#0A1426",
  inkSoft: "#16243C",
  inkLine: "#2A3B57",
  paper: "#F5F1E8",
  paperMute: "#C9C3B3",
  gold: "#D4A24C",
  goldHi: "#F2C875",
  red: "#E14B3E",
  green: "#3FB37F",
};

export function themeFromBranding(primaryColor: string, secondaryColor: string): DesignTheme {
  const ink = primaryColor || DEFAULT_DESIGN_THEME.ink;
  return {
    ...DEFAULT_DESIGN_THEME,
    ink,
    inkSoft: darkenHex(ink, 0.1),
    gold: secondaryColor || DEFAULT_DESIGN_THEME.gold,
    goldHi: lightenHex(secondaryColor || DEFAULT_DESIGN_THEME.gold, 0.15),
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return `rgba(10, 20, 38, ${alpha})`;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function darkenHex(hex: string, amount: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return DEFAULT_DESIGN_THEME.inkSoft;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const mix = (channel: number) =>
    Math.max(0, Math.round(channel * (1 - amount)));
  return `#${mix(r).toString(16).padStart(2, "0")}${mix(g).toString(16).padStart(2, "0")}${mix(b).toString(16).padStart(2, "0")}`;
}

function lightenHex(hex: string, amount: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return DEFAULT_DESIGN_THEME.goldHi;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const mix = (channel: number) =>
    Math.min(255, Math.round(channel + (255 - channel) * amount));
  return `#${mix(r).toString(16).padStart(2, "0")}${mix(g).toString(16).padStart(2, "0")}${mix(b).toString(16).padStart(2, "0")}`;
}

export function createDesignTokens(theme: DesignTheme) {
  return {
    W: CANVAS_WIDTH,
    H: CANVAS_HEIGHT,
    ...theme,
    fontDisplay: "var(--font-display), 'Anton', 'Oswald', 'Impact', sans-serif",
    fontBody: "var(--font-body), 'Inter', 'Helvetica Neue', sans-serif",
    fontMono: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
    margin: 64,
    gutter: 32,
    radius: 14,
  } as const;
}

export type DesignTokens = ReturnType<typeof createDesignTokens>;
