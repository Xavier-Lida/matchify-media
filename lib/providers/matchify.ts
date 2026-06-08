import type { LeagueProvider } from "./_base";

export const matchifyProvider: LeagueProvider = {
  id: "matchify",
  label: "Matchify.ca",
  inputType: "none",

  validateConfig(_config) {
    return null;
  },
};
