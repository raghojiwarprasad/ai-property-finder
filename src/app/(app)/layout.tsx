import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { currentIdentity } from "@/server/lib/session";
import { activeGoal } from "@/server/services/goals";
import { gatewayMode } from "@/server/gateway";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const identity = await currentIdentity();
  if (!identity) redirect("/?expired=1");
  const goal = await activeGoal(identity.learnerId);
  return (
    <AppShell goalLabel={goal?.interpretation ?? null} learnerLabel={identity.kind === "account" ? identity.email ?? "Signed in" : "Guest session"} fixtureMode={gatewayMode() === "fixture"}>
      {children}
    </AppShell>
  );
}
