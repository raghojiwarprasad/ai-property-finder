import { handler, requireLearner } from "@/server/lib/api";
import { createUpload } from "@/server/services/experience";
import { invalid } from "@/server/lib/errors";
import { config } from "@/server/lib/util";

export const dynamic = "force-dynamic";

/** POST /api/uploads (multipart): validate file and run owned, bounded extraction. */
export const POST = handler({ write: true, createGuest: true, rateLimit: { key: "upload", limit: 10, windowMs: 600_000 } }, async ({ identity, req }) => {
  const learner = requireLearner(identity);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw invalid("Choose a PDF, DOCX or TXT file.");
  if (file.size > config.maxUploadBytes) throw invalid("The file is larger than 10 MB.");
  const buffer = Buffer.from(await file.arrayBuffer());
  return createUpload(learner.learnerId, { buffer, filename: file.name, mimeType: file.type || "application/octet-stream" });
});
