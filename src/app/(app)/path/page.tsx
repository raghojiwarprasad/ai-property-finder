import Link from "next/link";
import type { Metadata } from "next";
import { currentIdentity } from "@/server/lib/session";
import { getPath, type PathView } from "@/server/services/learning";
import { SessionLengthControl } from "@/components/SessionLengthControl";

export const metadata: Metadata = { title: "My path" };
export const dynamic = "force-dynamic";

type MilestoneView = PathView["milestones"][number];

const fmtDate = (x: string) => new Date(x).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const STATE_LABEL: Record<string, string> = {
  unknown: "No evidence yet",
  introduced: "Introduced",
  practising: "Practising",
  demonstrated: "Demonstrated",
  needs_review: "Review due",
};

function badgeClass(label: MilestoneView["label"]): string {
  if (label === "Planned") return "badge planned";
  if (label === "Review due") return "badge caution";
  if (label === "Optional depth") return "badge neutral";
  return "badge";
}

/** S07: orientation without a knowledge graph. Goal, session preference, milestones in order, recent path changes. */
export default async function PathPage() {
  const identity = (await currentIdentity())!;
  const p = await getPath(identity.learnerId);

  if (!p.goal) {
    return (
      <div className="stack" style={{ maxWidth: 720 }}>
        <h1>Your path starts with a goal.</h1>
        <p className="prose muted">Once you choose what you want to do with AI, your milestones appear here with the evidence each one asks for.</p>
        <div className="row">
          <Link className="btn btn-primary btn-lg" href="/start/experience">Build my learning path</Link>
        </div>
      </div>
    );
  }

  const titleById = new Map(p.milestones.flatMap((m) => m.capabilities.map((c) => [c.id, c.title] as const)));

  return (
    <div className="stack">
      <div>
        <h1>Your path, with room to grow.</h1>
        <p className="prose muted">What you are working towards, the next milestone, and what you have already demonstrated. Milestones are read in order, but your work sets the pace.</p>
      </div>

      <section className="card" aria-labelledby="goal-heading">
        <div className="eyebrow">Your goal</div>
        <h2 id="goal-heading" style={{ fontSize: 20, lineHeight: "28px" }}>{p.goal.interpretation}</h2>
        <p className="muted">In your words: “{p.goal.originalText}”{p.goal.provisional ? " · This interpretation is provisional; you can narrow it whenever you like." : ""}</p>
        <div className="row" style={{ marginTop: 12 }}>
          <Link className="btn btn-secondary" href="/path/change-goal">Change goal</Link>
        </div>
        <hr className="divider" />
        <SessionLengthControl current={p.sessionMinutes} />
      </section>

      <section aria-labelledby="milestones-heading">
        <h2 id="milestones-heading">Milestones</h2>
        <p className="muted small" style={{ marginBottom: 16 }}>Ready and In progress milestones can be launched from Today. Planned milestones can be read about but have no lesson yet.</p>
        <ol className="stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {p.milestones.map((m, i) => (
            <li key={m.id}>
              <MilestoneCard m={m} index={i} titleById={titleById} />
            </li>
          ))}
        </ol>
      </section>

      <section className="card" aria-labelledby="revisions-heading">
        <h2 id="revisions-heading" style={{ fontSize: 20, lineHeight: "28px" }}>Recent changes to your path</h2>
        {p.revisions.length === 0 ? (
          <p className="muted">No changes yet. When your work changes the route, the reason appears here.</p>
        ) : (
          <ul className="trace" aria-label="Path revisions">
            {p.revisions.map((r) => (
              <li key={r.id} style={{ gridTemplateColumns: "1fr" }}>
                <div>
                  <span>{r.reasonText}</span>
                  <span className="muted small" style={{ display: "block" }}>{fmtDate(r.createdAt)} · <code>{r.reasonCode}</code></span>
                </div>
              </li>
            ))}
          </ul>
        )}
        {p.coverageNote && <p className="alert info" style={{ marginTop: 16 }}>{p.coverageNote}</p>}
      </section>

      <p className="footer-note">Previewing a later lesson never counts as demonstrating it. Only your work moves a capability forward.</p>
    </div>
  );
}

function MilestoneCard({ m, index, titleById }: { m: MilestoneView; index: number; titleById: Map<string, string> }) {
  const planned = m.status === "planned";
  const num = String(index + 1).padStart(2, "0");
  const total = m.capabilities.length;
  const headingId = `ms-${m.id}`;
  return (
    <article className={`card milestone${planned ? " planned" : ""}`} aria-labelledby={headingId}>
      <span aria-hidden="true" style={{ fontSize: 22, fontWeight: 800, color: planned ? "var(--text-2)" : "var(--primary)", lineHeight: "28px" }}>{num}</span>
      <div>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <h3 id={headingId} style={{ marginBottom: 4 }}>
            <span className="visually-hidden">Milestone {num}: </span>
            {m.title}
          </h3>
          <span className={badgeClass(m.label)}>{m.label}</span>
        </div>
        <p>{m.outcome}</p>
        <p className="muted small">
          {planned
            ? "Planned: the content for this milestone is not published yet. Nothing here can be launched or counted."
            : `${m.demonstratedCount} of ${total} ${m.optional ? "" : "required "}${total === 1 ? "capability" : "capabilities"} demonstrated`}
          {m.estimatedSessions && !planned ? ` · about ${m.estimatedSessions} sessions` : ""}
        </p>
        <details>
          <summary>Evidence, reasons and capabilities</summary>
          <div className="stack">
            <div>
              <h4>Evidence requirement</h4>
              <p>{m.evidenceRequirement}</p>
            </div>
            <div>
              <h4>Why this is here</h4>
              <p>{m.whyIncluded}</p>
            </div>
            <div>
              <h4>What you will have made</h4>
              <p>{m.outputDescription}</p>
            </div>
            <div>
              <h4>Capabilities</h4>
              <ul className="trace" aria-label={`Capabilities in ${m.title}`}>
                {m.capabilities.map((c) => (
                  <li key={c.id} style={{ gridTemplateColumns: "1fr" }}>
                    <div className="stack-sm">
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <strong>{c.title}</strong>
                        <span className={c.available ? (c.state === "needs_review" ? "badge caution" : "badge") : "badge planned"}>
                          {c.available ? STATE_LABEL[c.state] ?? c.state : "Planned"}
                        </span>
                      </div>
                      <span className="muted">{c.reason}</span>
                      {c.prerequisites.length > 0 && (
                        <span className="small muted">Builds on: {c.prerequisites.map((id) => titleById.get(id) ?? id).join(", ")}</span>
                      )}
                      {c.evidenceIds.length > 0 && (
                        <span className="small muted">{c.evidenceIds.length} piece{c.evidenceIds.length === 1 ? "" : "s"} of supporting evidence. <Link href="/work">See your work</Link></span>
                      )}
                      {c.available ? (
                        <span><Link href={`/path/preview/${c.id}`}>Preview the lesson</Link> <span className="small muted">(reading only; does not count as evidence)</span></span>
                      ) : (
                        <span className="small muted">No lesson published yet.</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      </div>
    </article>
  );
}
