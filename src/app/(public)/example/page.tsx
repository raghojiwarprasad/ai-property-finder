import type { Metadata } from "next";
import Link from "next/link";
import { OnboardingShell } from "@/components/OnboardingShell";
import { getSampleLesson } from "@/server/services/sample";
import { SampleTask } from "@/components/SampleTask";

export const metadata: Metadata = { title: "Try an example" };

/** Labelled sample lesson for a fictional learner. Creates no profile and saves nothing. */
export default function ExamplePage() {
  const s = getSampleLesson();
  const example = s.lesson.blocks.find((b) => b.type === "example" && b.sources);
  const concept = s.lesson.blocks.find((b) => b.type === "concept");
  return (
    <OnboardingShell step={null}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="eyebrow">Sample lesson</div>
        <span className="badge neutral">Fictional learner: {s.learner.name}</span>
      </div>
      <h1>{s.lesson.title}</h1>
      <p className="prose muted">This example uses a fictional learner whose context is “{s.learner.context}” and whose goal is “{s.learner.goal}”. Nothing you do here is saved.</p>
      <div className="stack" style={{ marginTop: 24 }}>
        <div className="bridge">
          <div className="label">Start with something you know</div>
          <p className="prose">{s.bridge.text}</p>
          {s.bridge.analogyLimit && <p className="note">Limit of the analogy: {s.bridge.analogyLimit}</p>}
        </div>
        {example && example.type === "example" && example.sources?.map((src) => (
          <div key={src.label} className="source"><span className="label">{src.label}</span>{src.text}</div>
        ))}
        {concept && concept.type === "concept" && (
          <div className="prose">
            {concept.heading && <h2>{concept.heading}</h2>}
            <p>{concept.text}</p>
          </div>
        )}
        <SampleTask item={s.shortItem ?? s.item} />
        <div className="card muted-surface">
          <h3>Make it yours</h3>
          <p>Your lesson uses your own experience for the bridge, and your work decides what comes next.</p>
          <div className="row"><Link className="btn btn-primary" href="/start/experience">Build my learning path</Link><Link className="btn btn-ghost" href="/">Back</Link></div>
        </div>
      </div>
    </OnboardingShell>
  );
}
