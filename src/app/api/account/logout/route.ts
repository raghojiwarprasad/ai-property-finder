import { handler } from "@/server/lib/api";
import { logout } from "@/server/services/identity";
import { authCookieValue, clearCookies } from "@/server/lib/session";

export const dynamic = "force-dynamic";

/** POST /api/account/logout: revoke the session and clear cookies (local caches are cleared client-side). */
export const POST = handler({ write: true }, async () => {
  await logout(await authCookieValue());
  await clearCookies();
  return { ok: true };
});
