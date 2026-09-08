import { z } from "zod";
import { handler, readJson } from "@/server/lib/api";
import { register } from "@/server/services/identity";
import { clearGuestCookie, currentGuest, setAuthCookie } from "@/server/lib/session";

export const dynamic = "force-dynamic";

/** POST /api/account/register: create an account and claim the current guest session atomically. */
export const POST = handler({ write: true, rateLimit: { key: "register", limit: 10, windowMs: 3600_000 } }, async ({ req }) => {
  const body = await readJson(req, z.object({ email: z.string(), password: z.string() }));
  const guest = await currentGuest();
  const r = await register(body.email, body.password, guest);
  await setAuthCookie(r.token);
  if (r.claimed) await clearGuestCookie();
  return { email: r.identity.email, claimed: r.claimed, learnerKind: r.identity.kind };
});
