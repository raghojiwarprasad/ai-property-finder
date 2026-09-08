import Link from "next/link";
import type { Metadata } from "next";
import { resolveShare } from "@/server/services/sharing";
import { SharedChallenge } from "@/components/SharedChallenge";

export const metadata: Metadata = { title: "Shared from Learn AI", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Supplied = { label: string; text: string };
type Field = { id: string; label: string };
type Option = { id: string; text: string };

/** S11 recipient page: no app shell, no identity. Unavailable and revoked links look the same and reveal nothing. */
export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await resolveShare(token);

  return (
    <div className="shell shell-single">
      <a href="#main" className="skip-link">Skip to content</a>
      <div>
        <header className="topnav" style={{ display: "flex" }}>
          <Link href="/" className="brand">Learn AI</Link>
        </header>
        <main id="main" className="main" style={{ maxWidth: 800 }}>
          {share.state === "unavailable" ? (
            <div className="stack" style={{ maxWidth: 640 }}>
              <h1 style={{ fontSize: 28, lineHeight: "36px" }}>This shared page is not available.</h1>
              <p className="prose muted">The link may have been removed or may never have existed.</p>
              <p><Link href="/">Go to Learn AI</Link></p>
            </div>
          ) : share.kind === "challenge" ? (
            <ChallengeView token={token} payload={share.payload} displayName={share.displayName} />
          ) : (
            <WorkView payload={share.payload} displayName={share.displayName} />
          )}
        </main>
      </div>
    </div>
  );
}

function Attribution({ displayName }: { displayName: string | null }) {
  if (!displayName) return null;
  return <p className="muted small">Shared by {displayName}</p>;
}

function ChallengeView({ token, payload, displayName }: { token: string; payload: Record<string, unknown>; displayName: string | null }) {
  const supplied = (payload.supplied as Supplied[] | undefined) ?? [];
  const prompt = (payload.prompt as { kind?: string; question?: string; options?: Option[]; allowUnsure?: boolean } | undefined) ?? {};
  const options = prompt.kind === "selected" && Array.isArray(prompt.options) ? prompt.options.map((o) => ({ id: o.id, text: o.text })) : [];
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">A short challenge</div>
        <h1 style={{ fontSize: 28, lineHeight: "36px" }}>{String(payload.title ?? "Challenge")}</h1>
        {payload.capabilityTitle ? <p className="muted">Capability: {String(payload.capabilityTitle)}</p> : null}
        <Attribution displayName={displayName} />
      </div>
      <section className="card" aria-labelledby="objective-heading">
        <h2 id="objective-heading" style={{ fontSize: 20, lineHeight: "28px" }}>The task</h2>
        <p className="prose">{String(payload.objective ?? "")}</p>
        {supplied.length > 0 && (
          <div className="stack-sm" style={{ marginTop: 12 }}>
            {supplied.map((s) => <blockquote key={s.label} className="source" style={{ margin: 0 }}><span className="label">{s.label}</span>{s.text}</blockquote>)}
          </div>
        )}
      </section>
      {options.length >= 2 ? (
        <SharedChallenge token={token} question={prompt.question ?? "Choose the best answer."} options={options} />
      ) : (
        <p className="alert info">This challenge cannot be answered here. You can still start your own path.</p>
      )}
      <p className="footer-note">No account is needed to try this. Nothing you answer here is stored against a profile.</p>
    </div>
  );
}

function WorkView({ payload, displayName }: { payload: Record<string, unknown>; displayName: string | null }) {
  const supplied = (payload.supplied as Supplied[] | undefined) ?? [];
  const fields = (payload.fields as Field[] | null | undefined) ?? null;
  const content = (payload.content as Record<string, string> | undefined) ?? {};
  const assisted = Boolean(payload.assisted);
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">A piece of learning work</div>
        <h1 style={{ fontSize: 28, lineHeight: "36px" }}>{String(payload.title ?? "Shared work")}</h1>
        {payload.capabilityTitle ? <p className="muted">Capability: {String(payload.capabilityTitle)}</p> : null}
        <Attribution displayName={displayName} />
        <div className="row"><span className="badge neutral">{assisted ? "Worked answer used" : "Independent work"}</span></div>
      </div>
      <section className="card" aria-labelledby="task-heading">
        <h2 id="task-heading" style={{ fontSize: 20, lineHeight: "28px" }}>The task</h2>
        <p className="prose">{String(payload.taskContext ?? "")}</p>
        {supplied.length > 0 && (
          <div className="stack-sm" style={{ marginTop: 12 }}>
            {supplied.map((s) => <blockquote key={s.label} className="source" style={{ margin: 0 }}><span className="label">{s.label}</span>{s.text}</blockquote>)}
          </div>
        )}
      </section>
      <section className="card" aria-labelledby="work-heading">
        <h2 id="work-heading" style={{ fontSize: 20, lineHeight: "28px" }}>The work</h2>
        {fields ? (
          <div className="stack-sm">
            {fields.map((f) => (
              <div key={f.id}>
                <span className="field-label" style={{ marginBottom: 2 }}>{f.label}</span>
                <p style={{ whiteSpace: "pre-wrap" }}>{content[f.id] || <span className="muted">(empty)</span>}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="stack-sm">
            {Object.entries(content).map(([k, v]) => <p key={k} className="prose" style={{ whiteSpace: "pre-wrap" }}>{v}</p>)}
          </div>
        )}
        {payload.assessmentScope ? <p className="muted small" style={{ marginTop: 12 }}>{String(payload.assessmentScope)}</p> : null}
      </section>
      <section className="card muted-surface" aria-labelledby="try-heading">
        <h2 id="try-heading" style={{ fontSize: 20, lineHeight: "28px" }}>Learn AI, starting with you</h2>
        <p>Bring your own experience and learn through tasks you can check, with feedback that names exactly what is missing.</p>
        <div className="row"><Link className="btn btn-primary" href="/">Start my own path</Link></div>
      </section>
    </div>
  );
}
