import { z } from "zod";
import { handler, readJson } from "@/server/lib/api";
import { attemptSharedChallenge } from "@/server/services/sharing";
import { clientKey } from "@/server/lib/session";

export const dynamic = "force-dynamic";

/** Recipient attempt: no account, no access to the creator's history. */
export const POST = handler({ write: true, rateLimit: { key: "share-attempt", limit: 30, windowMs: 600_000 } }, async ({ req, params }) => {
  const body = await readJson(req, z.object({ optionId: z.string() }));
  return attemptSharedChallenge(params.token, await clientKey(), body.optionId);
});
