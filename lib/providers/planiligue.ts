import type { LeagueProvider } from "./_base";

const PLANILIGUE_HOSTS = new Set(["planiligue.com", "www.planiligue.com"]);

export const planiligueProvider: LeagueProvider = {
  id: "planiligue",
  label: "Planiligue",
  inputType: "url",
  urlPlaceholder: "https://www.planiligue.com/...",

  validateConfig(config) {
    const url =
      typeof config.leagueUrl === "string" ? config.leagueUrl.trim() : "";
    if (!url) return "URL requise.";
    try {
      const host = new URL(url).hostname.toLowerCase();
      if (!PLANILIGUE_HOSTS.has(host) && !host.endsWith(".planiligue.com")) {
        return "L'URL doit provenir de planiligue.com.";
      }
    } catch {
      return "URL invalide.";
    }
    return null;
  },
};
