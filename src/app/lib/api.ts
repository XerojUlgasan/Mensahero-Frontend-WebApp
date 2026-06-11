import type { Session } from "@supabase/supabase-js";

type QueryValue = string | number | boolean | null | undefined;

interface CacheEnvelope<T> {
  data: T;
  updatedAt: number;
}

export function getApiBaseUrl() {
  const apiUrl = import.meta.env.VITE_API_URL ?? import.meta.env.API_URL;

  if (!apiUrl) {
    throw new Error("Missing VITE_API_URL environment variable.");
  }

  return apiUrl.replace(/\/$/, "");
}

function canUseStorage() {
  return typeof window !== "undefined";
}

export function createCacheKey(
  scope: string,
  session: Session | null,
  extra = "",
) {
  const userId = session?.user?.id ?? "anonymous";
  return ["mensahero", userId, scope, extra].filter(Boolean).join(":");
}

export function readCachedJson<T>(cacheKey: string): T | null {
  if (!canUseStorage()) return null;

  const raw = window.localStorage.getItem(cacheKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

export function writeCachedJson<T>(cacheKey: string, data: T) {
  if (!canUseStorage()) return;

  const envelope: CacheEnvelope<T> = {
    data,
    updatedAt: Date.now(),
  };

  window.localStorage.setItem(cacheKey, JSON.stringify(envelope));
}

export function hasDataChanged<T>(
  previousData: T | null | undefined,
  nextData: T,
) {
  return JSON.stringify(previousData) !== JSON.stringify(nextData);
}

export async function fetchJson<T>(
  session: Session,
  path: string,
  query?: Record<string, QueryValue>,
): Promise<T> {
  const url = new URL(`${getApiBaseUrl()}${path}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") return;
      url.searchParams.set(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `Request failed with status ${response.status}.`,
    );
  }

  return (await response.json()) as T;
}

export function formatDateLabel(value: string | null | undefined) {
  if (!value) return "never";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function shortId(value: string, length: number) {
  return value.slice(0, length);
}

export function maskSecret(value: string) {
  if (value.length <= 8) return value;

  return `${value.slice(0, 4)}••••••••${value.slice(-4)}`;
}
