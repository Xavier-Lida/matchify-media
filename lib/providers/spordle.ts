import type { LeagueProvider } from "./_base";

export const spordleProvider: LeagueProvider = {
  id: "spordle",
  label: "Spordle",
  inputType: "url",
  urlPlaceholder: "https://spordle.com/...",

  validateConfig(config) {
    const url =
      typeof config.leagueUrl === "string" ? config.leagueUrl.trim() : "";
    if (!url) return "URL requise.";
    try {
      const host = new URL(url).hostname.toLowerCase();
      if (host !== "spordle.com" && !host.endsWith(".spordle.com")) {
        return "L'URL doit provenir de spordle.com.";
      }
    } catch {
      return "URL invalide.";
    }
    return null;
  },
};
