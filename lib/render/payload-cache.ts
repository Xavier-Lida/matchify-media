import type { FullTimeRenderPayload } from "@/lib/render/types";

const TTL_MS = 60_000;

type CacheEntry = {
  payload: FullTimeRenderPayload;
  expiresAt: number;
};

const globalForCache = globalThis as typeof globalThis & {
  __matchifyRenderCache?: Map<string, CacheEntry>;
};

function getCache(): Map<string, CacheEntry> {
  if (!globalForCache.__matchifyRenderCache) {
    globalForCache.__matchifyRenderCache = new Map();
  }
  return globalForCache.__matchifyRenderCache;
}

function pruneExpired(cache: Map<string, CacheEntry>): void {
  const now = Date.now();
  for (const [id, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(id);
    }
  }
}

export function setRenderPayload(
  renderId: string,
  payload: FullTimeRenderPayload,
): void {
  const cache = getCache();
  pruneExpired(cache);
  cache.set(renderId, {
    payload,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function getRenderPayload(
  renderId: string,
): FullTimeRenderPayload | null {
  const cache = getCache();
  pruneExpired(cache);
  const entry = cache.get(renderId);
  if (!entry || entry.expiresAt <= Date.now()) {
    cache.delete(renderId);
    return null;
  }
  return entry.payload;
}

export function deleteRenderPayload(renderId: string): void {
  getCache().delete(renderId);
}
