import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("base64url")}`;
}

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function addHours(d: Date, h: number): Date {
  return new Date(d.getTime() + h * 3600_000);
}
export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86400_000);
}

export const RELEASE_VERSION = "r1-dev";
export const POLICY_VERSION = "policy-2026.09.1";

/** Product configuration with spec defaults. */
export const config = {
  rawUploadRetentionHours: Number(process.env.RAW_UPLOAD_RETENTION_HOURS ?? 24),
  guestRetentionDays: Number(process.env.GUEST_RETENTION_DAYS ?? 7),
  maxUploadBytes: 10 * 1024 * 1024,
  maxUploadPages: 50,
  maxExtractedChars: 80_000,
  manualMinChars: 20,
  manualMaxChars: 8000,
  goalMinChars: 5,
  goalMaxChars: 1000,
  extractionSoftTimeoutMs: 20_000,
  extractionDeadlineMs: 60_000,
  reviewIntervalsDays: [2, 7, 21],
  modelTimeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 25_000),
};

/** Clock abstraction so retention tests can advance time. */
export const clock = {
  offsetMs: 0,
  now(): Date {
    return new Date(Date.now() + clock.offsetMs);
  },
};
