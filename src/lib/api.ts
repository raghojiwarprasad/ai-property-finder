"use client";

/** Browser-side API client: JSON envelope, typed errors, idempotency keys. */
export class ApiError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number, public readonly details: Record<string, unknown> | null = null) {
    super(message);
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; form?: FormData; signal?: AbortSignal } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(path, { method: init.method ?? (init.body !== undefined || init.form ? "POST" : "GET"), headers, body: init.form ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined), signal: init.signal, credentials: "same-origin", cache: "no-store" });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw new ApiError("cancelled", "Cancelled.", 0);
    throw new ApiError("offline", "You appear to be offline. Your work is kept on this page; try again when you reconnect.", 0);
  }
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const e = (data as { error?: { code: string; message: string; details: Record<string, unknown> | null } })?.error;
    throw new ApiError(e?.code ?? "error", e?.message ?? `Request failed (${res.status}).`, res.status, e?.details ?? null);
  }
  return data as T;
}

export function newKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Per-viewer local convenience storage with try/catch around every access. */
export const local = {
  get(key: string): string | null {
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string): void {
    try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
  },
  remove(key: string): void {
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
  },
  clearPrivate(): void {
    try {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i += 1) { const k = window.localStorage.key(i); if (k && k.startsWith("lai:")) keys.push(k); }
      for (const k of keys) window.localStorage.removeItem(k);
    } catch { /* ignore */ }
  },
};
