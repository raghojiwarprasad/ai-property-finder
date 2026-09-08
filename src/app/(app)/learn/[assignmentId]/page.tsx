import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentIdentity } from "@/server/lib/session";
import { getActivityView } from "@/server/services/learning";
import { getThread } from "@/server/services/tutor";
import { LessonPlayer } from "@/components/LessonPlayer";
import { AppError } from "@/server/lib/errors";
import Link from "next/link";

export const metadata: Metadata = { title: "Lesson" };
export const dynamic = "force-dynamic";

/** S04/S05: lesson player, task and feedback, with the contextual tutor. */
export default async function LearnPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const identity = (await currentIdentity())!;
  let view;
  try {
    view = await getActivityView(identity.learnerId, assignmentId);
  } catch (err) {
    if (err instanceof AppError && (err.status === 403 || err.status === 404)) {
      return (
        <div className="stack" style={{ maxWidth: 640 }}>
          <h1>That activity is not available</h1>
          <p className="prose muted">It may belong to another session or no longer exist. Your own activities are always reachable from Today.</p>
          <Link className="btn btn-primary" href="/today">Go to Today</Link>
        </div>
      );
    }
    throw err;
  }
  if (view.practiceId) redirect(`/practice/${assignmentId}`);
  const thread = await getThread(identity.learnerId, assignmentId);
  return <LessonPlayer initial={view} initialThread={thread} />;
}
