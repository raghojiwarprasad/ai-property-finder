import { cookies, headers } from "next/headers";
import { AUTH_COOKIE, GUEST_COOKIE, createGuestSession, resolveAccount, resolveGuest, touchLearner, type Identity } from "@/server/services/identity";
import { unauthenticated } from "./errors";

const secure = process.env.NODE_ENV === "production";

/** Returns the current identity (account first, then guest) or null. */
export async function currentIdentity(): Promise<Identity | null> {
  const jar = await cookies();
  const account = await resolveAccount(jar.get(AUTH_COOKIE)?.value);
  if (account) return account;
  const guest = await resolveGuest(jar.get(GUEST_COOKIE)?.value);
  return guest;
}

/** Guest identity even when an account cookie is also present (used for claim). */
export async function currentGuest(): Promise<Identity | null> {
  const jar = await cookies();
  return resolveGuest(jar.get(GUEST_COOKIE)?.value);
}

/** Returns the identity, creating a guest session when the visitor has none. Only for route handlers/actions. */
export async function requireIdentity(): Promise<Identity> {
  const existing = await currentIdentity();
  if (existing) {
    void touchLearner(existing.learnerId).catch(() => undefined);
    return existing;
  }
  const { identity, token } = await createGuestSession();
  const jar = await cookies();
  jar.set(GUEST_COOKIE, token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 7 * 86400 });
  return identity;
}

export async function requireExistingIdentity(): Promise<Identity> {
  const id = await currentIdentity();
  if (!id) throw unauthenticated("Your session has expired. Start again to continue.");
  return id;
}

export async function setAuthCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(AUTH_COOKIE, token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 30 * 86400 });
}

export async function clearCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete(AUTH_COOKIE);
  jar.delete(GUEST_COOKIE);
}

export async function clearGuestCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(GUEST_COOKIE);
}

export async function authCookieValue(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE)?.value;
}

/** Origin check for state-changing requests (CSRF protection alongside SameSite cookies). */
export async function assertSameOrigin(): Promise<void> {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("host");
  if (!origin) return; // non-browser or same-origin form post without Origin header
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw unauthenticated("Invalid request origin.");
  }
  if (host && originHost !== host) throw unauthenticated("Cross-origin request rejected.");
}

export async function clientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}
