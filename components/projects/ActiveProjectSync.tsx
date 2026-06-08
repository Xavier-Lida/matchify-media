"use client";

import { useEffect } from "react";

/** Définit le cookie projet actif via la route API (autorisée à modifier les cookies). */
export function ActiveProjectSync({ projectId }: { projectId: string }) {
  useEffect(() => {
    void fetch(`/api/projects/${projectId}/active`, { method: "POST" });
  }, [projectId]);

  return null;
}
