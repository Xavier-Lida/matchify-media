/**
 * Polices disponibles dans l'éditeur — liste dynamique (table `fonts`) + Arial système.
 */

export interface FontDefinition {
  id: string;
  name: string;
  regular_url: string;
  bold_url: string | null;
}

export const SYSTEM_FONTS = ["Arial"] as const;

export function mergeFontFamilyNames(custom: FontDefinition[]): string[] {
  const names = custom.map((f) => f.name);
  return [...SYSTEM_FONTS, ...names.filter((n) => !SYSTEM_FONTS.includes(n as "Arial"))];
}
