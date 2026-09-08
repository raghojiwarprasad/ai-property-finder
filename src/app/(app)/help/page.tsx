import Link from "next/link";
import type { Metadata } from "next";
import { gatewayMode } from "@/server/gateway";

export const metadata: Metadata = { title: "Help" };
export const dynamic = "force-dynamic";

/** Plain-prose help: the three destinations, how evidence works, correcting context, export and deletion, fixture mode. */
export default function HelpPage() {
  const fixture = gatewayMode() === "fixture";
  return (
    <div className="stack prose" style={{ maxWidth: 720 }}>
      <div>
        <h1 style={{ fontSize: 28, lineHeight: "36px" }}>How this works</h1>
        <p className="muted">Short answers to the questions most people have in their first week.</p>
      </div>

      <section aria-labelledby="h-places">
        <h2 id="h-places" style={{ fontSize: 20, lineHeight: "28px" }}>The three places</h2>
        <p><strong><Link href="/today">Today</Link></strong> shows one next activity and why it is next. If you left a task half-finished, it resumes there before anything new is offered. You can make a session shorter or longer at any time.</p>
        <p><strong><Link href="/path">My path</Link></strong> shows your goal and the milestones that lead to it, in order. Each milestone states the outcome it is for and the evidence it asks for. You can expand a milestone to see its capabilities, preview a lesson, or change your goal. Milestones marked Planned are on the route but have no published content yet; they cannot be launched.</p>
        <p><strong><Link href="/work">My work</Link></strong> keeps every task you have submitted, with its feedback, the help you used and the capability it contributes to. Drafts are labelled as drafts and can be resumed.</p>
      </section>

      <section aria-labelledby="h-feedback">
        <h2 id="h-feedback" style={{ fontSize: 20, lineHeight: "28px" }}>Feedback and evidence</h2>
        <p>Each task is checked against a small set of criteria. Feedback tells you the result in ordinary words, the main gap if there is one, and the next move. You can challenge a grade from the work item; the original grade stays on record and is shown as provisional until someone reviews it.</p>
        <p>A capability moves to Demonstrated only through your own work on more than one distinct task, usually including a transfer task in a different setting. Nothing is awarded for reading a lesson, previewing later content, or saying you already know something; in that last case a short check is offered instead.</p>
        <p><strong>Independent versus assisted.</strong> If you open a worked answer or ask the tutor for the solution before submitting, the attempt is labelled “Worked answer used”. That is a normal part of learning and nothing to hide; it simply counts as practice rather than independent evidence. A fresh variant of the task then gives you the chance to demonstrate it on your own.</p>
        <p><strong>Review due.</strong> After a while, a demonstrated capability is checked again in a new situation. Until then it still shows as demonstrated. A review that goes badly does not erase earlier work; it marks where a refresh is needed.</p>
        <p>There is no overall score or percentage. Progress is always stated as which capabilities you have demonstrated, under what conditions, and how recently.</p>
      </section>

      <section aria-labelledby="h-context">
        <h2 id="h-context" style={{ fontSize: 20, lineHeight: "28px" }}>Correcting your context</h2>
        <p>Personal examples are built from facts you confirmed from your CV or your own description, or from scenarios clearly labelled as imagined. If an example uses something wrong or out of date, open <Link href="/profile">Your profile</Link> to edit or remove the fact. Examples stop using it immediately, and any shared copy that mentioned it is flagged for you to review. Removing a fact never changes what you have demonstrated.</p>
      </section>

      <section aria-labelledby="h-data">
        <h2 id="h-data" style={{ fontSize: 20, lineHeight: "28px" }}>Export or delete your data</h2>
        <p>Any single piece of work can be exported as a readable Markdown file from its page in My work. Exporting downloads a file to your device; it does not publish anything or create a link.</p>
        <p>A full export of your account, and deletion of your account and everything in it, are available from <Link href="/settings">Settings</Link>. Deletion removes your profile facts, uploaded documents, work, feedback and tutor conversations. Shared links you created stop working.</p>
        <p>Sharing is always a separate, deliberate step. You see exactly what would be public before publishing, employer names and personal facts are excluded, your name is off by default, and you can revoke a link at any time.</p>
      </section>

      <section aria-labelledby="h-fixture">
        <h2 id="h-fixture" style={{ fontSize: 20, lineHeight: "28px" }}>The “Development fixture mode” label</h2>
        <p>{fixture ? "You are seeing this label now. " : ""}It appears when no model provider is configured for this installation. Lessons, tasks and criteria are the same reviewed content either way, but personal examples, tutoring and the grading of written work then use deterministic, pre-reviewed fixtures instead of a live model. Results are honest about this: written work that the fixtures cannot judge is marked provisional rather than guessed.</p>
      </section>

      <p className="footer-note">Something not covered here? The tutor inside any lesson can answer questions about the task in front of you.</p>
    </div>
  );
}
