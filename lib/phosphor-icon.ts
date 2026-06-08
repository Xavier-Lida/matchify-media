export const PHOSPHOR_ICON_BASE = "/phosphor-icons/SVGs/regular"

export const phosphorIconNames = [
  "lightning",
  "squares-four",
  "download-simple",
  "sign-in",
  "sign-out",
  "layout",
  "folder-simple",
  "shield",
  "arrow-clockwise",
  "check-circle",
  "plugs",
  "database",
  "images",
  "arrow-square-out",
] as const

export type PhosphorIconName = (typeof phosphorIconNames)[number]

export function phosphorIconSrc(name: PhosphorIconName): string {
  return `${PHOSPHOR_ICON_BASE}/${name}.svg`
}
