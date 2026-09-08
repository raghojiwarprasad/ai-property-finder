import type { Metadata } from "next";
import { OnboardingShell } from "@/components/OnboardingShell";
import { ExperienceInput } from "@/components/ExperienceInput";
import { currentIdentity } from "@/server/lib/session";
import { listFacts } from "@/server/services/experience";

export const metadata: Metadata = { title: "Bring your experience" };
export const dynamic = "force-dynamic";

/** S02: collect the minimum context that can improve teaching. */
export default async function ExperiencePage() {
  const identity = await currentIdentity();
  const existing = identity ? await listFacts(identity.learnerId) : [];
  return (
    <OnboardingShell step="1 of 2">
      <h1>Bring your experience.</h1>
      <p className="prose muted">What experience are you bringing? Upload your CV, or tell us about one task or project you know well. We use it to choose examples, not to judge you.</p>
      <ExperienceInput existingFactCount={existing.length} />
    </OnboardingShell>
  );
}
