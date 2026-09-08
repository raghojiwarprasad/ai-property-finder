import { and, eq, isNull } from "drizzle-orm";
import { getDb, schema } from "@/server/db";
import { addDays, clock, config, hashPassword, hashToken, newId, newToken, verifyPassword } from "@/server/lib/util";
import { conflict, invalid, unauthenticated } from "@/server/lib/errors";
import { track } from "@/server/lib/analytics";
import type { LearnerPreferences } from "@/server/db/schema";

export const GUEST_COOKIE = "lai_guest";
export const AUTH_COOKIE = "lai_auth";

export type Identity = {
  learnerId: string;
  kind: "guest" | "account";
  userId: string | null;
  email: string | null;
  preferences: LearnerPreferences;
  profileVersion: number;
  stateVersion: number;
};

type Learner = typeof schema.learners.$inferSelect;

function toIdentity(l: Learner, email: string | null): Identity {
  return {
    learnerId: l.id,
    kind: l.kind as "guest" | "account",
    userId: l.userId,
    email,
    preferences: l.preferences,
    profileVersion: l.profileVersion,
    stateVersion: l.stateVersion,
  };
}

/** Creates a bounded guest session (PRD-01 F07). Returns the raw cookie token once. */
export async function createGuestSession(): Promise<{ identity: Identity; token: string }> {
  const db = await getDb();
  const token = newToken();
  const id = newId("lrn");
  const now = clock.now();
  const [row] = await db.insert(schema.learners).values({
    id, kind: "guest", tokenHash: hashToken(token), expiresAt: addDays(now, config.guestRetentionDays), createdAt: now, lastSeenAt: now,
  }).returning();
  await track("guest_session_created", id);
  return { identity: toIdentity(row, null), token };
}

/** Resolves a guest identity from its cookie token. Expired or claimed sessions resolve to null. */
export async function resolveGuest(token: string | undefined): Promise<Identity | null> {
  if (!token) return null;
  const db = await getDb();
  const rows = await db.select().from(schema.learners).where(and(eq(schema.learners.tokenHash, hashToken(token)), eq(schema.learners.kind, "guest"), isNull(schema.learners.deletedAt))).limit(1);
  const l = rows[0];
  if (!l) return null;
  if (l.expiresAt && l.expiresAt.getTime() < clock.now().getTime()) return null;
  if (l.claimedAt) return null;
  return toIdentity(l, null);
}

/** Resolves an account identity from its auth cookie token. */
export async function resolveAccount(token: string | undefined): Promise<Identity | null> {
  if (!token) return null;
  const db = await getDb();
  const sessions = await db.select().from(schema.authSessions).where(and(eq(schema.authSessions.tokenHash, hashToken(token)), isNull(schema.authSessions.revokedAt))).limit(1);
  const s = sessions[0];
  if (!s || s.expiresAt.getTime() < clock.now().getTime()) return null;
  const users = await db.select().from(schema.users).where(and(eq(schema.users.id, s.userId), isNull(schema.users.deletedAt))).limit(1);
  const u = users[0];
  if (!u) return null;
  const learner = await activeLearnerForUser(u.id);
  if (!learner) return null;
  return toIdentity(learner, u.email);
}

async function activeLearnerForUser(userId: string): Promise<Learner | null> {
  const db = await getDb();
  const rows = await db.select().from(schema.learners).where(and(eq(schema.learners.userId, userId), eq(schema.learners.kind, "account"), isNull(schema.learners.archivedAt), isNull(schema.learners.deletedAt))).limit(1);
  return rows[0] ?? null;
}

export async function touchLearner(learnerId: string): Promise<void> {
  const db = await getDb();
  await db.update(schema.learners).set({ lastSeenAt: clock.now() }).where(eq(schema.learners.id, learnerId));
}

function validateEmail(email: string): string {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 200) throw invalid("Enter a valid email address.");
  return e;
}

function validatePassword(p: string): void {
  if (typeof p !== "string" || p.length < 10) throw invalid("Use a password of at least 10 characters.");
  if (p.length > 200) throw invalid("That password is too long.");
}

/** Registers an account. If a guest identity is supplied and unclaimed, it is claimed atomically (PRD-10 F01). */
export async function register(emailRaw: string, password: string, guest: Identity | null): Promise<{ token: string; identity: Identity; claimed: boolean }> {
  const email = validateEmail(emailRaw);
  validatePassword(password);
  const db = await getDb();
  const existing = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing.length > 0) throw conflict("An account with that email already exists. Sign in instead.");
  const userId = newId("usr");
  const now = clock.now();
  await db.insert(schema.users).values({ id: userId, email, passwordHash: hashPassword(password), createdAt: now });
  let claimed = false;
  if (guest && guest.kind === "guest") {
    claimed = await claimGuest(guest.learnerId, userId);
  }
  if (!claimed) {
    await db.insert(schema.learners).values({ id: newId("lrn"), kind: "account", userId, createdAt: now, lastSeenAt: now });
  }
  const token = await createAuthSession(userId);
  const identity = (await resolveAccount(token))!;
  await track("account_created", identity.learnerId, { claimed });
  return { token, identity, claimed };
}

export async function login(emailRaw: string, password: string): Promise<{ token: string; identity: Identity }> {
  const email = validateEmail(emailRaw);
  const db = await getDb();
  const users = await db.select().from(schema.users).where(and(eq(schema.users.email, email), isNull(schema.users.deletedAt))).limit(1);
  const u = users[0];
  if (!u || !verifyPassword(password, u.passwordHash)) throw unauthenticated("Email or password did not match.");
  const token = await createAuthSession(u.id);
  const identity = (await resolveAccount(token))!;
  return { token, identity };
}

async function createAuthSession(userId: string): Promise<string> {
  const db = await getDb();
  const token = newToken();
  await db.insert(schema.authSessions).values({ id: newId("ses"), userId, tokenHash: hashToken(token), expiresAt: addDays(clock.now(), 30) });
  return token;
}

export async function logout(token: string | undefined): Promise<void> {
  if (!token) return;
  const db = await getDb();
  await db.update(schema.authSessions).set({ revokedAt: clock.now() }).where(eq(schema.authSessions.tokenHash, hashToken(token)));
}

/**
 * Atomic single-use guest claim. Returns false when the user already has an active
 * learner record (caller must surface a merge preview instead of overwriting).
 */
export async function claimGuest(guestLearnerId: string, userId: string): Promise<boolean> {
  const db = await getDb();
  const existing = await activeLearnerForUser(userId);
  if (existing) return false;
  const now = clock.now();
  const updated = await db.update(schema.learners)
    .set({ kind: "account", userId, tokenHash: null, claimedAt: now, expiresAt: null, lastSeenAt: now })
    .where(and(eq(schema.learners.id, guestLearnerId), eq(schema.learners.kind, "guest"), isNull(schema.learners.claimedAt), isNull(schema.learners.deletedAt)))
    .returning();
  if (updated.length === 1) {
    await track("guest_claimed", guestLearnerId, { userId: "redacted" });
    return true;
  }
  return false;
}

/** Merge-conflict resolution when an account already has progress (PRD-10 F01). */
export async function resolveClaimConflict(
  guestLearnerId: string,
  userId: string,
  choice: "keep_account" | "switch_to_guest",
): Promise<void> {
  const db = await getDb();
  const existing = await activeLearnerForUser(userId);
  if (!existing) {
    const ok = await claimGuest(guestLearnerId, userId);
    if (!ok) throw conflict("This guest session has already been claimed.");
    return;
  }
  if (choice === "keep_account") {
    // Guest work stays under its guest record until it expires; nothing is overwritten.
    await track("claim_conflict_resolved", existing.id, { choice });
    return;
  }
  // switch_to_guest: archive the account learner (records preserved and exportable), then claim the guest.
  await db.update(schema.learners).set({ archivedAt: clock.now() }).where(eq(schema.learners.id, existing.id));
  const ok = await claimGuest(guestLearnerId, userId);
  if (!ok) {
    await db.update(schema.learners).set({ archivedAt: null }).where(eq(schema.learners.id, existing.id));
    throw conflict("This guest session has already been claimed.");
  }
  await track("claim_conflict_resolved", guestLearnerId, { choice });
}

export async function updatePreferences(learnerId: string, patch: Partial<LearnerPreferences>): Promise<LearnerPreferences> {
  const db = await getDb();
  const rows = await db.select().from(schema.learners).where(eq(schema.learners.id, learnerId)).limit(1);
  const current = rows[0];
  if (!current) throw unauthenticated();
  const next: LearnerPreferences = { ...current.preferences };
  if (patch.sessionMinutes !== undefined) {
    if (![10, 20, 40].includes(patch.sessionMinutes)) throw invalid("Session length must be 10, 20 or 40 minutes.");
    next.sessionMinutes = patch.sessionMinutes;
  }
  if (patch.personalExamples !== undefined) next.personalExamples = Boolean(patch.personalExamples);
  if (patch.exampleDomainOverride !== undefined) next.exampleDomainOverride = patch.exampleDomainOverride ? String(patch.exampleDomainOverride).slice(0, 40) : null;
  if (patch.reminders !== undefined) next.reminders = Boolean(patch.reminders);
  await db.update(schema.learners).set({ preferences: next }).where(eq(schema.learners.id, learnerId));
  return next;
}

/** Summary used by the merge preview. */
export async function progressSummary(learnerId: string): Promise<{ goal: string | null; attempts: number; artefacts: number }> {
  const db = await getDb();
  const goals = await db.select({ text: schema.goalVersions.originalText }).from(schema.goalVersions).where(and(eq(schema.goalVersions.learnerId, learnerId), eq(schema.goalVersions.status, "active"))).limit(1);
  const attempts = await db.select({ id: schema.attempts.id }).from(schema.attempts).where(eq(schema.attempts.learnerId, learnerId));
  const artefacts = await db.select({ id: schema.artefactVersions.id }).from(schema.artefactVersions).where(eq(schema.artefactVersions.learnerId, learnerId));
  return { goal: goals[0]?.text ?? null, attempts: attempts.length, artefacts: artefacts.length };
}

export async function findUserByEmail(email: string) {
  const db = await getDb();
  const rows = await db.select().from(schema.users).where(eq(schema.users.email, email.trim().toLowerCase())).limit(1);
  return rows[0] ?? null;
}
