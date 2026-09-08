import { NextResponse } from "next/server";
import { handler, requireLearner } from "@/server/lib/api";
import { exportAccount } from "@/server/services/privacy";

export const dynamic = "force-dynamic";

/** POST /api/exports: owned-data export (synchronous for the pilot; the job record is kept). */
export const POST = handler({ write: true, rateLimit: { key: "export", limit: 5, windowMs: 3600_000 } }, async ({ identity }) => {
  const data = await exportAccount(requireLearner(identity).learnerId);
  return new NextResponse(JSON.stringify(data, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="learn-ai-export.json"`, "Cache-Control": "no-store" } });
});
