import Link from "next/link";
import type { Metadata } from "next";
import { currentIdentity } from "@/server/lib/session";
import { activeGoal } from "@/server/services/goals";
import { DESTINATION_META } from "@/server/services/goalRules";
import type { Destination } from "@/content/types";
import { ChangeGoalFlow } from "@/components/ChangeGoalFlow";

export const metadata: Metadata = { title: "Change goal" };
export const dynamic = "force-dynamic";

const CHOICES: Destination[] = ["use", "lead", "marketing", "build", "research"];

/** Goal change with a before/after summary (spec/02 §11, PRD-02 F03). Old evidence is preserved. */
export default async function ChangeGoalPage() {
  const identity = (await currentIdentity())!;
  const goal = await activeGoal(identity.learnerId);
  const destinations = CHOICES.map((id) => ({ id, label: DESTINATION_META[id].label, description: DESTINATION_META[id].description }));

  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <p><Link href="/path">← Back to My path</Link></p>
      <div>
        <h1 style={{ fontSize: 28, lineHeight: "36px" }}>Change your goal.</h1>
        <p className="prose muted">
          {goal ? <>Your current goal: “{goal.interpretation}”. </> : null}
          Choose a new destination to see what carries over before anything changes. Work you have demonstrated stays yours; the path keeps a record of the change.
        </p>
      </div>
      <ChangeGoalFlow destinations={destinations} currentDestination={(goal?.destination as Destination | undefined) ?? null} />
    </div>
  );
}
