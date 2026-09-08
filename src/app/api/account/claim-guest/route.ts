import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { resolveClaimConflict } from "@/server/services/identity";
import { clearGuestCookie, currentGuest } from "@/server/lib/session";
import { invalid } from "@/server/lib/errors";

export const dynamic = "force-dynamic";

/** POST /api/account/claim-guest: authenticated ownership transfer with an explicit merge policy. */
export const POST = handler({ write: true }, async ({ identity, req }) => {
  const account = requireLearner(identity);
  if (account.kind !== "account" || !account.userId) throw invalid("Sign in first to claim guest progress.");
  const body = await readJson(req, z.object({ choice: z.enum(["keep_account", "switch_to_guest"]) }));
  const guest = await currentGuest();
  if (!guest) throw invalid("No guest session to claim.");
  await resolveClaimConflict(guest.learnerId, account.userId, body.choice);
  await clearGuestCookie();
  return { ok: true, choice: body.choice };
});
