import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { currentIdentity } from "@/server/lib/session";
import { getWork, type WorkDetail } from "@/server/services/work";
import { AppError } from "@/server/lib/errors";
import { AppealButton } from "@/components/AppealButton";
import { ShareDialog } from "@/components/ShareDialog";

export const metadata: Metadata = { title: "Work item" };
export const dynamic = "force-dynamic";

const fmtDate = (x: string) => new Date(x).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const RESULT_WORDS: Record<string, string> = {
  pass: "Met the task’s criteria",
  fail: "Did not yet meet the criteria",
  pending: "Feedback pending",
};
const STATE_LABEL: Record<string, string> = {
  unknown: "No evidence yet",
  introduced: "Introduced",
  practising: "Practising",
  demonstrated: "Demonstrated",
  needs_review: "Review due",
};
const ASSISTANCE_WORDS: Record<string, string> = {
  hint_1: "Used the first hint",
  hint_2: "Used the second hint",
  hint_3: "Used the third hint",
  worked_answer: "Opened the worked answer before submitting",
  tutor_solution: "Asked the tutor for the solution",
  tutor: "Talked to the tutor",
  simpler: "Asked for a simpler explanation",
  deeper: "Asked for a deeper explanation",
};
const CRITERION_MARK: Record<string, string> = { met: "✓", not_met: "✗", uncertain: "?" };
const CRITERION_WORD: Record<string, string> = { met: "Met", not_met: "Not met", uncertain: "Uncertain" };

/** S09 item detail: task, work, feedback, support history, evidence context, versions and first-versus-latest comparison. */
export default async function WorkItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id.startsWith("draft:")) redirect(`/learn/${id.slice("draft:".length)}`);
  const identity = (await currentIdentity())!;
  let d: WorkDetail;
  try {
    d = await getWork(identity.learnerId, id);
  } catch (err) {
    if (err instanceof AppError) notFound();
    throw err;
  }
  const ev = d.evaluation;
  const resultWord = ev ? RESULT_WORDS[ev.result] ?? ev.result : "No feedback yet";
  const wasAppealed = d.evaluationHistory.some((e) => e.reason === "appeal");

  return (
    <div className="stack" style={{ maxWidth: 880 }}>
      <p><Link href="/work">← Back to My work</Link></p>
      <div>
        <div className="eyebrow">{d.item.milestoneTitle || "Work"}</div>
        <h1 style={{ fontSize: 28, lineHeight: "36px" }}>{d.item.title}</h1>
        <p className="muted">
          Capability: {d.item.capabilityTitle} · Version {d.item.version} of {d.versions.length} · Saved {fmtDate(d.item.createdAt)}
        </p>
        <div className="row">
          {d.item.isDraft && <span className="badge neutral">Draft</span>}
          {d.item.assisted && <span className="badge neutral">Worked answer used</span>}
          {d.evidence?.independent && <span className="badge">Independent evidence</span>}
        </div>
      </div>

      <div className="row" aria-label="Actions">
        <a className="btn btn-secondary" href={`/api/work/${d.item.id}/export`} download>Export as Markdown</a>
        {d.attemptId && ev && ev.result !== "pending" && <AppealButton attemptId={d.attemptId} />}
        {!d.item.isDraft && <ShareDialog artefactId={d.item.id} />}
      </div>
      <p className="muted small">Export downloads a file to your device. Nothing is published, and no public link is created.</p>

      <section className="card" aria-labelledby="task-heading">
        <h2 id="task-heading" style={{ fontSize: 20, lineHeight: "28px" }}>The task</h2>
        <p className="prose">{d.task?.objective ?? d.item.taskContext}</p>
        {d.task?.supplied?.length ? (
          <div className="stack-sm" style={{ marginTop: 12 }}>
            {d.task.supplied.map((s) => (
              <blockquote key={s.label} className="source" style={{ margin: 0 }}>
                <span className="label">{s.label}</span>
                {s.text}
              </blockquote>
            ))}
          </div>
        ) : null}
      </section>

      <section className="card" aria-labelledby="work-heading">
        <h2 id="work-heading" style={{ fontSize: 20, lineHeight: "28px" }}>Your work</h2>
        <WorkContent content={d.content} fields={d.fields} />
      </section>

      <section className="card" aria-labelledby="feedback-heading">
        <h2 id="feedback-heading" style={{ fontSize: 20, lineHeight: "28px" }}>Feedback</h2>
        {!ev ? (
          <p className="muted">{d.item.isDraft ? "This is a draft. Submit it from the lesson to get feedback." : "No feedback has been recorded for this version yet."}</p>
        ) : (
          <div className="stack">
            <p>
              <strong>{resultWord}</strong>
              {ev.status === "provisional" && <span className="badge caution" style={{ marginLeft: 8 }}>Provisional</span>}
              <span className="muted small" style={{ display: "block" }}>Evaluated {fmtDate(ev.createdAt)}{ev.evaluator === "human" ? " · human review" : ""}</span>
            </p>
            <p className="prose">{ev.summary}</p>
            {ev.mainGap && <p><strong>Main gap:</strong> {ev.mainGap}</p>}
            {ev.nextMove && <p><strong>Next move:</strong> {ev.nextMove}</p>}
            {ev.criteria.length > 0 && (
              <div>
                <h3 style={{ fontSize: 16, lineHeight: "24px" }}>Criteria</h3>
                <ul className="criteria">
                  {ev.criteria.map((c) => (
                    <li key={c.id}>
                      <span className={`mark ${c.status}`} aria-hidden="true">{CRITERION_MARK[c.status]}</span>
                      <span>
                        <span className="visually-hidden">{CRITERION_WORD[c.status]}: </span>
                        {c.label}{c.critical ? <span className="muted small"> (critical)</span> : null}
                        {c.note && <span className="muted small" style={{ display: "block" }}>{c.note}</span>}
                        {c.span && <span className="small" style={{ display: "block" }}>“{c.span}”</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="grid-2">
        <section className="card" aria-labelledby="assist-heading">
          <h2 id="assist-heading" style={{ fontSize: 20, lineHeight: "28px" }}>Help you used</h2>
          {d.assistance.length === 0 ? (
            <p className="muted">No hints, worked answers or tutor solutions were used before this attempt.</p>
          ) : (
            <ul className="trace">
              {d.assistance.map((a, i) => <li key={`${a}-${i}`} style={{ gridTemplateColumns: "1fr" }}><span>{ASSISTANCE_WORDS[a] ?? a.replace(/_/g, " ")}</span></li>)}
            </ul>
          )}
          {d.item.assisted && <p className="muted small" style={{ marginTop: 12 }}>Using a worked answer is a normal part of learning. It means this attempt counts as practice rather than independent evidence; a fresh variant gives you the chance to show it on your own.</p>}
        </section>

        <section className="card" aria-labelledby="evidence-heading">
          <h2 id="evidence-heading" style={{ fontSize: 20, lineHeight: "28px" }}>What this counts for</h2>
          {d.evidence ? (
            <div className="stack-sm">
              <p><strong>{d.item.capabilityTitle}:</strong> {STATE_LABEL[d.evidence.capabilityState] ?? d.evidence.capabilityState}</p>
              <p className="muted">{d.evidence.reason}</p>
              <p className="small">{d.evidence.independent ? "This attempt counted as independent evidence." : "This attempt did not count as independent evidence."}</p>
            </div>
          ) : (
            <p className="muted">No capability record is attached to this item yet.</p>
          )}
        </section>
      </div>

      {d.comparison && (
        <section className="card" aria-labelledby="compare-heading">
          <h2 id="compare-heading" style={{ fontSize: 20, lineHeight: "28px" }}>First versus latest</h2>
          <div className="two-col">
            <div>
              <h3 style={{ fontSize: 16, lineHeight: "24px" }}>First version {d.comparison.firstAssisted && <span className="badge neutral">Worked answer used</span>}</h3>
              <WorkContent content={d.comparison.first} fields={d.fields} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, lineHeight: "24px" }}>Latest version {d.comparison.latestAssisted && <span className="badge neutral">Worked answer used</span>}</h3>
              <WorkContent content={d.comparison.latest} fields={d.fields} />
            </div>
          </div>
          <h3 style={{ fontSize: 16, lineHeight: "24px", marginTop: 16 }}>What changed</h3>
          <ul className="trace">
            {d.comparison.improvements.map((t) => <li key={t} style={{ gridTemplateColumns: "1fr" }}><span>{t}</span></li>)}
          </ul>
        </section>
      )}

      {d.evaluationHistory.length > 1 && (
        <section className="card" aria-labelledby="history-heading">
          <h2 id="history-heading" style={{ fontSize: 20, lineHeight: "28px" }}>Evaluation history</h2>
          <p className="muted small">{wasAppealed ? "You challenged a grade. The original evaluation is preserved; later entries show what the review decided." : "Earlier evaluations are preserved alongside the latest one."}</p>
          <div className="scroll-x">
            <table>
              <thead><tr><th scope="col">When</th><th scope="col">Result</th><th scope="col">Status</th><th scope="col">Why</th><th scope="col">Summary</th></tr></thead>
              <tbody>
                {d.evaluationHistory.map((e) => (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDate(e.createdAt)}</td>
                    <td>{RESULT_WORDS[e.result] ?? e.result}</td>
                    <td>{e.status}</td>
                    <td>{e.reason ?? "first evaluation"}</td>
                    <td>{e.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card" aria-labelledby="versions-heading">
        <h2 id="versions-heading" style={{ fontSize: 20, lineHeight: "28px" }}>Versions</h2>
        <ul className="trace">
          {d.versions.map((v) => (
            <li key={v.id} style={{ gridTemplateColumns: "1fr" }}>
              <span>
                {v.id === d.item.id ? <strong>Version {v.version} (this one)</strong> : <Link href={`/work/${v.id}`}>Version {v.version}</Link>}
                <span className="muted small"> · {fmtDate(v.createdAt)} · {v.result ? RESULT_WORDS[v.result] ?? v.result : "no feedback"}{v.assisted ? " · worked answer used" : ""}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function WorkContent({ content, fields }: { content: Record<string, unknown>; fields: WorkDetail["fields"] }) {
  if (fields) {
    return (
      <div className="stack-sm">
        {fields.map((f) => (
          <div key={f.id} className="fact-row" style={{ flexDirection: "column", gap: 4 }}>
            <span className="field-label" style={{ marginBottom: 0 }}>{f.label}</span>
            <span className="value" style={{ whiteSpace: "pre-wrap" }}>{String(content[f.id] ?? "") || <span className="muted">(left empty)</span>}</span>
          </div>
        ))}
      </div>
    );
  }
  if (typeof content.text === "string") return <p className="prose" style={{ whiteSpace: "pre-wrap" }}>{content.text}</p>;
  if (typeof content.optionId === "string") return <p>Selected option: <code>{content.optionId}</code></p>;
  const shown = Object.fromEntries(Object.entries(content).filter(([k]) => k !== "trace" && k !== "runId"));
  return <pre>{JSON.stringify(shown, null, 2)}</pre>;
}
