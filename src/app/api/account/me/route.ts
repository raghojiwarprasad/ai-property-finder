import { handler } from "@/server/lib/api";
import { gatewayMode } from "@/server/gateway";
import { listFacts } from "@/server/services/experience";
import { activeGoal } from "@/server/services/goals";
import { listShares } from "@/server/services/sharing";

export const dynamic = "force-dynamic";

export const GET = handler({}, async ({ identity }) => {
  if (!identity) return { identity: null, aiMode: gatewayMode() };
  const goal = await activeGoal(identity.learnerId);
  return {
    identity: { kind: identity.kind, email: identity.email, preferences: identity.preferences, profileVersion: identity.profileVersion },
    facts: await listFacts(identity.learnerId),
    goal: goal ? { id: goal.id, originalText: goal.originalText, interpretation: goal.interpretation, destination: goal.destination } : null,
    shares: await listShares(identity.learnerId),
    aiMode: gatewayMode(),
  };
});
