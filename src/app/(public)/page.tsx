import Link from "next/link";
import { currentIdentity } from "@/server/lib/session";
import { activeGoal } from "@/server/services/goals";

export const dynamic = "force-dynamic";

/** S01: arrival. One promise, one primary action, a labelled example explanation. No feature wall. */
export default async function ArrivalPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const identity = await currentIdentity();
  const goal = identity ? await activeGoal(identity.learnerId) : null;
  return (
    <div className="shell shell-single">
      <a href="#main" className="skip-link">Skip to content</a>
      <div>
        <header className="topnav" style={{ display: "flex" }}>
          <span className="brand">Learn AI</span>
          <nav aria-label="Utilities" className="row">
            {goal ? <Link className="navlink" href="/today">Continue</Link> : <Link className="navlink" href="/account">Log in</Link>}
          </nav>
        </header>
        <main id="main" tabIndex={-1} className="main" style={{ maxWidth: 960 }}>
          {sp.expired && <p className="alert caution" role="status">Your session had expired, so we started a fresh one. Nothing you saved to an account is affected.</p>}
          <section className="stack" style={{ maxWidth: 720, marginBottom: 48 }}>
            <div className="eyebrow">Personalised AI learning</div>
            <h1>Learn AI, starting with you.</h1>
            <p className="prose">Bring your experience. Choose what you want to do with AI. Start with a lesson built around you.</p>
            <div className="row">
              <Link className="btn btn-primary btn-lg" href={goal ? "/today" : "/start/experience"}>{goal ? "Continue my path" : "Build my learning path"}</Link>
              <Link className="btn btn-secondary btn-lg" href="/example">Try an example</Link>
            </div>
          </section>

          <section className="card" aria-labelledby="example-heading" style={{ maxWidth: 720, marginBottom: 48 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 id="example-heading" style={{ fontSize: 20, lineHeight: "28px" }}>What a personalised explanation looks like</h2>
              <span className="badge neutral">Example learner</span>
            </div>
            <div className="bridge" style={{ marginTop: 12 }}>
              <div className="label">Start with something you know</div>
              <p>You have compared supplier quotes. Imagine an assistant summarises two quotes. One answer looks polished: “Delivery is guaranteed within 12 days.” The source only says “estimated 12–15 business days.” The problem is not its writing; it is the missing evidence.</p>
              <p className="note">Example learner context is fictional. Your lesson uses your own experience, and you can correct or switch it at any time.</p>
            </div>
          </section>

          <section style={{ marginBottom: 48 }} aria-labelledby="how-heading">
            <h2 id="how-heading">Three steps, then you are learning</h2>
            <div className="stack">
              <div className="hero-step"><span className="num">1</span><div><h3>Bring your experience</h3><p className="muted">Upload a CV or describe one task you know well. Contact details are not needed.</p></div></div>
              <div className="hero-step"><span className="num">2</span><div><h3>Choose what you want to do with AI</h3><p className="muted">Use it well, lead decisions, build, apply it in marketing, or study deeply. Your goal sets the destination; your work sets the pace.</p></div></div>
              <div className="hero-step"><span className="num">3</span><div><h3>Learn through a task you can check</h3><p className="muted">A short explanation, a real task, and feedback that names exactly what worked and what is missing.</p></div></div>
            </div>
          </section>

          <section aria-labelledby="outcomes-heading">
            <h2 id="outcomes-heading">Representative outcomes</h2>
            <div className="grid-2">
              <div className="card compact"><h3>Use</h3><p className="muted">A reusable task brief and an answer checked against its sources.</p></div>
              <div className="card compact"><h3>Lead</h3><p className="muted">A one-page pilot memo with a baseline, success measures and failure conditions.</p></div>
              <div className="card compact"><h3>Build</h3><p className="muted">An evaluation set for a grounded assistant, with failure cases.</p></div>
              <div className="card compact"><h3>Study</h3><p className="muted">An explained prediction experiment, with the longer research route shown honestly as planned.</p></div>
            </div>
          </section>
          <p className="footer-note">No guaranteed expertise, no fixed time to research readiness, no career predictions. The ambition is exceptional learning, demonstrated through your work.</p>
        </main>
      </div>
    </div>
  );
}
