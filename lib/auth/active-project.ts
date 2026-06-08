import "server-only";

import { cookies } from "next/headers";

export const ACTIVE_PROJECT_COOKIE = "active_project_id";

const COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 365,
};

export async function getActiveProjectId(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACTIVE_PROJECT_COOKIE)?.value ?? null;
}

/** Uniquement depuis une Route Handler ou Server Action. */
export async function setActiveProjectCookie(projectId: string) {
  const store = await cookies();
  store.set(ACTIVE_PROJECT_COOKIE, projectId, COOKIE_OPTIONS);
}
