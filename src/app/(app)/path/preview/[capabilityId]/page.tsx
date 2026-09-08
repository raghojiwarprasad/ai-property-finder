import Link from "next/link";
import type { Metadata } from "next";
import { previewCapability } from "@/server/services/learning";

export const metadata: Metadata = { title: "Lesson preview" };
export const dynamic = "force-dynamic";

/** Read-only preview of a published lesson (PRD-03 F05). Nothing here is interactive and nothing is awarded. */
export default async function PreviewPage({ params }: { params: Promise<{ capabilityId: string }> }) {
  const { capabilityId } = await params;
  const { lesson, available } = previewCapability(capabilityId);

  if (!lesson || !available) {
    return (
      <div className="stack" style={{ maxWidth: 720 }}>
        <p><Link href="/path">← Back to My path</Link></p>
        <div className="card milestone planned" style={{ gridTemplateColumns: "1fr" }}>
          <div>
            <span className="badge planned">Planned</span>
            <h1 style={{ fontSize: 28, lineHeight: "36px", marginTop: 12 }}>This lesson is not published yet.</h1>
            <p className="prose">It is part of your path so you can see where the route leads, but there is no content to read and nothing to launch. We will not invent a lesson to fill the gap.</p>
          </div>
        </div>
      </div>
    );
  }

  const blocks = lesson.blocks.filter((b) => b.type === "concept" || b.type === "example");

  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <p><Link href="/path">← Back to My path</Link></p>
      <div>
        <div className="eyebrow">Preview</div>
        <h1 style={{ fontSize: 28, lineHeight: "36px" }}>{lesson.title}</h1>
        <p className="prose muted">{lesson.outcome}</p>
      </div>
      <p className="alert info" role="note">Preview only. Reading this does not count as demonstrating the capability. The check and the practice task appear when the lesson is assigned from Today.</p>
      <div className="prose stack">
        {blocks.map((b) => (
          <section key={b.id} aria-label={b.type === "example" ? b.heading : b.heading ?? "Concept"}>
            {b.type === "concept" && b.heading && <h2 style={{ fontSize: 20, lineHeight: "28px" }}>{b.heading}</h2>}
            {b.type === "example" && <h2 style={{ fontSize: 20, lineHeight: "28px" }}>Example: {b.heading}</h2>}
            <p style={{ whiteSpace: "pre-wrap" }}>{b.text}</p>
            {b.type === "example" && b.sources?.length ? (
              <div className="stack-sm">
                {b.sources.map((s) => (
                  <blockquote key={s.label} className="source" style={{ margin: 0 }}>
                    <span className="label">{s.label}</span>
                    {s.text}
                  </blockquote>
                ))}
              </div>
            ) : null}
          </section>
        ))}
      </div>
      <p className="muted small">About {lesson.durationMinutes[0]}–{lesson.durationMinutes[1]} minutes when taken for real, including the check.</p>
      <p><Link href="/path">← Back to My path</Link></p>
    </div>
  );
}
