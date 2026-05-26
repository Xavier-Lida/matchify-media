"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  createDesignTokens,
  DEFAULT_DESIGN_THEME,
  type DesignTheme,
  type DesignTokens,
} from "@/lib/design/tokens";

const DesignThemeContext = createContext<DesignTokens>(
  createDesignTokens(DEFAULT_DESIGN_THEME),
);

export function DesignThemeProvider({
  theme,
  children,
}: {
  theme: DesignTheme;
  children: ReactNode;
}) {
  const tokens = createDesignTokens(theme);
  return (
    <DesignThemeContext.Provider value={tokens}>
      {children}
    </DesignThemeContext.Provider>
  );
}

export function useDesignTokens(): DesignTokens {
  return useContext(DesignThemeContext);
}
