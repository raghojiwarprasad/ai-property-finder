import Link from "next/link";
import type { Metadata } from "next";
import { currentIdentity } from "@/server/lib/session";
import { getToday } from "@/server/services/learning";
import { SessionLengthControl } from "@/components/SessionLengthControl";

export const metadata: Metadata = { title: "Today" };
export const dynamic = "force-dynamic";

/** S06: one primary next action; a due review and one recent achievement stay secondary. */
export default async function TodayPage() {
  const identity = (await currentIdentity())!;
  const t = await getToday(identity.learnerId);

  if (t.variant === "no_goal") {
    return (
      <div className="stack" style={{ maxWidth: 720 }}>
        <h1>Start with your goal.</h1>
        <p className="prose muted">Tell us what you want to do with AI and we will build a first lesson around your experience.</p>
        <div className="row">
          <Link className="btn btn-primary btn-lg" href="/start/experience">Build my learning path</Link>
          <Link className="btn btn-secondary" href="/example">Try an example</Link>
        </div>
      </div>
    );
  }

  const heading =
    t.variant === "first_lesson" ? "Your first lesson is ready." :
    t.variant === "active_draft" ? "Pick up where you left off." :
    t.variant === "returning" ? "Let's pick up from here." :
    t.variant === "milestone_complete" ? "Milestone complete. Here is the next one." :
    t.variant === "goal_complete" ? "You have demonstrated every published capability for this goal." :
    t.variant === "content_unavailable" ? "You have reached the edge of published content." :
    "Your next useful step.";
  const sub =
    t.variant === "returning" ? `It has been ${t.awayDays} days. A short check first, then back into your milestone; nothing you demonstrated has been lost.` :
    t.variant === "active_draft" ? "Your draft is saved. Continue the same activity." :
    t.variant === "goal_complete" ? "A deliberate stopping point is part of good learning. Review is available when you want it, and you can choose a deeper goal from My path." :
    "Build on what you have already practised.";

  return (
    <div className="stack">
      <div>
        <h1>{heading}</h1>
        <p className="prose muted">{sub}</p>
      </div>

      {t.next ? (
        <section className="card" aria-labelledby="next-heading">
          <div className="eyebrow">Next capability</div>
          <h2 id="next-heading">{t.next.capabilityTitle}</h2>
          <p className="prose">{t.next.reasonText}</p>
          <p className="muted small">
            About {t.next.minutes[0]}–{t.next.minutes[1]} minutes · {t.next.activityType === "lesson" ? "Explanation + practice" : t.next.activityType === "practice" ? "Simulation" : t.next.activityType === "review" ? "Quick review" : t.next.activityType === "transfer" ? "Transfer task" : "Independent check"} · {t.next.milestoneTitle}
          </p>
          <div className="row">
            <Link className="btn btn-primary btn-lg" href={t.next.activityType === "practice" ? `/practice/${t.next.assignmentId}` : `/learn/${t.next.assignmentId}`}>
              {t.variant === "active_draft" ? "Continue" : "Continue learning"}
            </Link>
            <details>
              <summary className="btn btn-ghost">Why this next?</summary>
              <p className="small muted" style={{ maxWidth: 560 }}>{t.next.reasonText} Reason code: <code>{t.next.reasonCode}</code>. Open My path to see the supporting evidence.</p>
            </details>
          </div>
        </section>
      ) : (
        <section className="card">
          <h2>{t.variant === "goal_complete" ? "Nothing is required today" : "No published next activity"}</h2>
          <p className="prose">{t.coverageNote ?? "Review your demonstrated capabilities from My path, or choose a deeper goal."}</p>
          <div className="row"><Link className="btn btn-secondary" href="/path">Open My path</Link><Link className="btn btn-secondary" href="/work">See your work</Link></div>
        </section>
      )}

      <div className="grid-2">
        {t.review && (
          <section className="card" aria-label="Review due">
            <h3>A quick review</h3>
            <p className="muted">Check “{t.review.capabilityTitle}” in a new situation. It will be offered after your current activity.</p>
          </section>
        )}
        {t.achievement && (
          <section className="card" aria-label="Recent achievement">
            <h3>Your recent work</h3>
            <p>{t.achievement.text}</p>
            <Link href={t.achievement.artefactId ? `/work/${t.achievement.artefactId}` : "/work"}>See your work →</Link>
          </section>
        )}
      </div>

      <SessionLengthControl current={t.sessionMinutes} />
      <p className="footer-note">One goal. One next action. Your work shapes the path.</p>
    </div>
  );
}
