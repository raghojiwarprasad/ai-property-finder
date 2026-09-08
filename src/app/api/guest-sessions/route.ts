import { handler } from "@/server/lib/api";

export const dynamic = "force-dynamic";

/** POST /api/guest-sessions: create (or reuse) a bounded guest session. Secure cookie, no chosen user ID. */
export const POST = handler({ write: true, createGuest: true, rateLimit: { key: "guest", limit: 30, windowMs: 60_000 } }, async ({ identity }) => ({
  learnerKind: identity!.kind, preferences: identity!.preferences,
}));
