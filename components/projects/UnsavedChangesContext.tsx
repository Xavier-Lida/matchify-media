"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface UnsavedChangesCtx {
  isDirty: boolean;
  setDirty: (v: boolean) => void;
}

const Ctx = createContext<UnsavedChangesCtx>({
  isDirty: false,
  setDirty: () => {},
});

export function UnsavedChangesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDirty, setDirty] = useState(false);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  return <Ctx.Provider value={{ isDirty, setDirty }}>{children}</Ctx.Provider>;
}

export function useUnsavedChanges() {
  return useContext(Ctx);
}
