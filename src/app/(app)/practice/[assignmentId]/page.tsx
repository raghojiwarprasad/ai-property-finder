import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { currentIdentity } from "@/server/lib/session";
import { getActivityView } from "@/server/services/learning";
import { listRuns, publicPractice, type TraceEvent, type RunResult } from "@/server/services/practice";
import { getPractice } from "@/content";
import { PracticeWorkspace, type RunView } from "@/components/PracticeWorkspace";

export const metadata: Metadata = { title: "Practice" };
export const dynamic = "force-dynamic";

/** S08: practice workspace for a practice assignment. Lessons and tasks live under /learn. */
export default async function PracticePage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const identity = (await currentIdentity())!;
  const view = await getActivityView(identity.learnerId, assignmentId);
  if (!view.practiceId) redirect(`/learn/${assignmentId}`);
  const template = getPractice(view.practiceId);
  if (!template) notFound();
  const runs = await listRuns(identity.learnerId, template.id);
  const runViews: RunView[] = runs.map((r) => ({
    id: r.id,
    runNumber: r.runNumber,
    scenarioKey: r.scenarioKey,
    configuration: r.configuration,
    trace: r.trace as unknown as TraceEvent[],
    outcome: r.outcome as unknown as RunResult["outcome"],
    createdAt: r.createdAt.toISOString(),
  }));
  return (
    <div style={{ maxWidth: 860 }}>
      <PracticeWorkspace
        assignmentId={assignmentId}
        template={publicPractice(template)}
        runs={runViews}
        milestoneTitle={view.assignment.milestoneTitle}
        capabilityTitle={view.assignment.capabilityTitle}
      />
    </div>
  );
}
