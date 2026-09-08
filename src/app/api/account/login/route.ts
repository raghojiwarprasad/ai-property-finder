import { z } from "zod";
import { handler, readJson } from "@/server/lib/api";
import { login, progressSummary } from "@/server/services/identity";
import { currentGuest, setAuthCookie } from "@/server/lib/session";

export const dynamic = "force-dynamic";

/** POST /api/account/login. If a guest session with progress exists, returns a merge preview instead of overwriting. */
export const POST = handler({ write: true, rateLimit: { key: "login", limit: 20, windowMs: 900_000 } }, async ({ req }) => {
  const body = await readJson(req, z.object({ email: z.string(), password: z.string() }));
  const guest = await currentGuest();
  const r = await login(body.email, body.password);
  await setAuthCookie(r.token);
  let mergePreview: { guest: Awaited<ReturnType<typeof progressSummary>>; account: Awaited<ReturnType<typeof progressSummary>> } | null = null;
  if (guest) {
    const g = await progressSummary(guest.learnerId);
    if (g.goal || g.attempts > 0) mergePreview = { guest: g, account: await progressSummary(r.identity.learnerId) };
  }
  return { email: r.identity.email, mergePreview };
});
