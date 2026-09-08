import Link from "next/link";
import type { Metadata } from "next";
import { currentIdentity } from "@/server/lib/session";
import { listFacts } from "@/server/services/experience";
import { getProjections } from "@/server/services/learning";
import { listShares } from "@/server/services/sharing";
import { getCapability } from "@/content";
import { FactList } from "@/components/FactList";
import { PreferencesForm } from "@/components/PreferencesForm";
import { DataControls } from "@/components/DataControls";

export const metadata: Metadata = { title: "Your profile" };
export const dynamic = "force-dynamic";

const STATE_LABEL: Record<string, { label: string; tone: string }> = {
  unknown: { label: "Unknown", tone: "neutral" },
  introduced: { label: "Introduced", tone: "neutral" },
  practising: { label: "Practising", tone: "" },
  demonstrated: { label: "Demonstrated", tone: "" },
  needs_review: { label: "Review due", tone: "caution" },
};

/**
 * S10: profile, memory and settings. "Experience I use for examples" (editable context) is kept
 * separate from "What your work has demonstrated" (evidence). Preferences and data controls follow.
 */
export default async function ProfilePage() {
  const identity = (await currentIdentity())!;
  const [facts, projections, shares] = await Promise.all([
    listFacts(identity.learnerId),
    getProjections(identity.learnerId),
    listShares(identity.learnerId),
  ]);
  const capabilities = projections
    .map((p) => ({ projection: p, capability: getCapability(p.capabilityId) }))
    .filter((x) => x.capability)
    .sort((a, b) => a.capability!.title.localeCompare(b.capability!.title));

  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <div>
        <h1>Your profile</h1>
        <p className="prose muted">What the product remembers about you, and what your work has shown. You control both.</p>
      </div>

      <section className="card" aria-labelledby="experience-heading">
        <div className="eyebrow">Context</div>
        <h2 id="experience-heading">Experience I use for examples</h2>
        <p className="muted" style={{ marginBottom: 16 }}>These facts only choose familiar examples and a starting check. They never limit what you can learn. Removing one changes future examples; completed work is kept.</p>
        <FactList facts={facts.map((f) => ({ id: f.id, factType: f.factType, value: f.value, sourceType: f.sourceType, confirmed: f.confirmed }))} profileVersion={identity.profileVersion} />
      </section>

      <section className="card" aria-labelledby="demonstrated-heading">
        <div className="eyebrow">Evidence</div>
        <h2 id="demonstrated-heading">What your work has demonstrated</h2>
        <p className="muted" style={{ marginBottom: 16 }}>Each capability shows the state your work supports and why. There is no overall score; the reason is the record.</p>
        {capabilities.length === 0 ? (
          <p className="muted">Nothing yet. Your first task creates the first evidence. <Link href="/today">Go to Today</Link>.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }} aria-label="Capabilities">
            {capabilities.map(({ projection: p, capability: c }) => {
              const s = STATE_LABEL[p.state] ?? { label: p.state, tone: "neutral" };
              return (
                <li key={p.capabilityId} className="fact-row">
                  <div className="value">
                    <div className="row" style={{ gap: 8 }}>
                      <span className={`badge ${s.tone}`.trim()}>{s.label}</span>
                      <strong>{c!.title}</strong>
                    </div>
                    {p.reason && <p className="small muted" style={{ margin: "4px 0 0" }}>{p.reason}</p>}
                    {p.reviewDueAt && p.state === "needs_review" && <p className="small muted" style={{ margin: "4px 0 0" }}>Review due {new Date(p.reviewDueAt).toLocaleDateString()}.</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p style={{ marginTop: 16 }}><Link href="/path">See how this fits your path →</Link></p>
      </section>

      <section className="card" aria-labelledby="preferences-heading">
        <div className="eyebrow">Preferences</div>
        <h2 id="preferences-heading">Preferences</h2>
        <PreferencesForm preferences={identity.preferences} />
      </section>

      <section className="card" aria-labelledby="data-heading">
        <div className="eyebrow">Your data</div>
        <h2 id="data-heading">Your data</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          {identity.kind === "account"
            ? `Signed in as ${identity.email ?? "your account"}.`
            : "You are in a guest session, kept for seven days. Save your progress from Settings to keep it longer."}
        </p>
        <DataControls shares={shares} accountKind={identity.kind} />
      </section>
    </div>
  );
}
