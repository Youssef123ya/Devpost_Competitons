import type { ExternalAuthProviders } from "../contexts/AuthContext";
import type { PublicLandingOverview } from "../services/api";

const LANDING_CACHE_KEY = "uxfriends_startup_landing";
const PROVIDERS_CACHE_KEY = "uxfriends_startup_providers";

const LANDING_CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const PROVIDERS_CACHE_TTL_MS = 1000 * 60 * 30;

interface CachedValue<T> {
  cachedAt: number;
  value: T;
}

function readCache<T>(key: string, ttlMs: number) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CachedValue<T>;
    if (
      typeof parsed?.cachedAt !== "number" ||
      Date.now() - parsed.cachedAt > ttlMs
    ) {
      window.localStorage.removeItem(key);
      return null;
    }

    return parsed.value;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function writeCache<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: CachedValue<T> = {
    cachedAt: Date.now(),
    value,
  };

  window.localStorage.setItem(key, JSON.stringify(payload));
}

export function getCachedLandingOverview() {
  return readCache<PublicLandingOverview>(LANDING_CACHE_KEY, LANDING_CACHE_TTL_MS);
}

export function setCachedLandingOverview(value: PublicLandingOverview) {
  writeCache(LANDING_CACHE_KEY, value);
}

export function getCachedExternalProviders() {
  return readCache<ExternalAuthProviders>(
    PROVIDERS_CACHE_KEY,
    PROVIDERS_CACHE_TTL_MS,
  );
}

export function setCachedExternalProviders(value: ExternalAuthProviders) {
  writeCache(PROVIDERS_CACHE_KEY, value);
}
