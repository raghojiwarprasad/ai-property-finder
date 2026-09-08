import type { Metadata } from "next";
import { OnboardingShell } from "@/components/OnboardingShell";
import { GoalInput } from "@/components/GoalInput";
import { currentIdentity } from "@/server/lib/session";
import { getCatalogue } from "@/content";

export const metadata: Metadata = { title: "What do you want to do with AI?" };
export const dynamic = "force-dynamic";

/** S03: collect the destination and launch learning. */
export default async function GoalPage() {
  const identity = await currentIdentity();
  const suggestions = getCatalogue().goalSuggestions;
  return (
    <OnboardingShell step="2 of 2">
      <h1>What do you want to do with AI?</h1>
      <p className="prose muted">Choose a suggestion or write your own. Your goal sets the destination and depth. Your work decides the pace.</p>
      <GoalInput suggestions={suggestions} sessionMinutes={identity?.preferences.sessionMinutes ?? 20} />
    </OnboardingShell>
  );
}
