import Link from "next/link";
import type { Metadata } from "next";
import { currentIdentity } from "@/server/lib/session";
import { listWork, type WorkItem } from "@/server/services/work";

export const metadata: Metadata = { title: "My work" };
export const dynamic = "force-dynamic";

const fmtDate = (x: string) => new Date(x).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const STATUS: Record<WorkItem["feedbackStatus"], { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "badge neutral" },
  pending: { label: "Feedback pending", cls: "badge caution" },
  reviewed: { label: "Reviewed", cls: "badge" },
  revised: { label: "Revised", cls: "badge" },
};

/** S09: work listed by milestone with feedback status and assistance context. Drafts resume; they never count as demonstrations. */
export default async function WorkPage() {
  const identity = (await currentIdentity())!;
  const items = await listWork(identity.learnerId);

  if (items.length === 0) {
    return (
      <div className="stack" style={{ maxWidth: 720 }}>
        <h1>Your work, with its context.</h1>
        <div className="card">
          <p className="prose">Nothing saved yet. Your first task will appear here with its feedback.</p>
          <div className="row" style={{ marginTop: 12 }}><Link className="btn btn-primary" href="/today">Go to Today</Link></div>
        </div>
      </div>
    );
  }

  const groups = new Map<string, WorkItem[]>();
  for (const it of items) {
    const key = it.isDraft && !it.milestoneTitle ? "Drafts" : it.milestoneTitle || "Other work";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  }
  const ordered = Array.from(groups.entries()).sort(([a], [b]) => (a === "Drafts" ? -1 : b === "Drafts" ? 1 : 0));

  return (
    <div className="stack">
      <div>
        <h1>Your work, with its context.</h1>
        <p className="prose muted">Every item keeps its task, its feedback and whether you used help. Independent work and assisted work are labelled, never merged into one score.</p>
      </div>

      {ordered.map(([group, rows]) => (
        <section key={group} className="card" aria-labelledby={`grp-${slug(group)}`}>
          <h2 id={`grp-${slug(group)}`} style={{ fontSize: 20, lineHeight: "28px" }}>{group}</h2>
          {group === "Drafts" && <p className="muted small">Saved but not submitted. A draft cannot appear as a completed demonstration.</p>}
          <div className="scroll-x">
            <table>
              <thead>
                <tr>
                  <th scope="col">Work</th>
                  <th scope="col">Versions</th>
                  <th scope="col">Feedback</th>
                  <th scope="col">Saved</th>
                  <th scope="col"><span className="visually-hidden">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((it) => {
                  const draftAssignment = it.id.startsWith("draft:") ? it.id.slice("draft:".length) : null;
                  const s = STATUS[it.feedbackStatus];
                  return (
                    <tr key={it.id}>
                      <td>
                        <strong>{it.title}</strong>
                        <span className="muted small" style={{ display: "block" }}>{it.capabilityTitle}</span>
                        {it.assisted && <span className="badge neutral" style={{ marginTop: 4 }}>Worked answer used</span>}
                      </td>
                      <td>{it.versions === 0 ? "—" : it.versions === 1 ? "1 version" : `${it.versions} versions`}</td>
                      <td><span className={s.cls}>{s.label}</span></td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmtDate(it.createdAt)}</td>
                      <td>
                        {draftAssignment ? (
                          <Link className="btn btn-secondary" href={`/learn/${draftAssignment}`}>Resume<span className="visually-hidden"> {it.title}</span></Link>
                        ) : (
                          <Link href={`/work/${it.id}`}>Open<span className="visually-hidden"> {it.title}</span></Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <p className="footer-note">A completion record here states the reviewed task and its conditions. It is not a professional qualification.</p>
    </div>
  );
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "group";
}
