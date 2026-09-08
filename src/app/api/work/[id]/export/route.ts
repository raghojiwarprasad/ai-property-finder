import { NextResponse } from "next/server";
import { handler, requireLearner } from "@/server/lib/api";
import { exportWorkMarkdown } from "@/server/services/work";

export const dynamic = "force-dynamic";

/** GET /api/work/:id/export: readable Markdown export. Creates no public URL. */
export const GET = handler({}, async ({ identity, params }) => {
  const md = await exportWorkMarkdown(requireLearner(identity).learnerId, params.id);
  return new NextResponse(md, { headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="learn-ai-work-${params.id}.md"`, "Cache-Control": "no-store" } });
});
