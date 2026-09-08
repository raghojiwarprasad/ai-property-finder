"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

type Suggestion = { id: string; label: string; text: string };
type Proposal = {
  goalVersionId: string; originalText: string; interpretation: string; destination: string; destinationLabel: string; inScope: boolean; aiReformulation: string | null; clarifyingQuestion: string | null; provisional: boolean; interpreter: "rules" | "live";
  firstMilestone: { id: string; title: string; outcome: string; evidenceRequirement: string } | null; coverage: { published: string[]; planned: string[]; gapNote: string | null };
  contextFacts: Array<{ id: string; factType: string; value: string; sourceType: string }>; researchNote: string | null; milestones: Array<{ id: string; title: string; status: "published" | "planned"; optional: boolean }>;
};

export function GoalInput({ suggestions, sessionMinutes }: { suggestions: Suggestion[]; sessionMinutes: number }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [minutes, setMinutes] = useState<10 | 20 | 40>(sessionMinutes as 10 | 20 | 40);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [editing, setEditing] = useState(false);
  const [interp, setInterp] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [factEdit, setFactEdit] = useState<{ id: string; value: string } | null>(null);

  const interpret = async () => {
    setBusy("interpret"); setError(null);
    try {
      const p = await api<Proposal>("/api/goals", { body: { text, sessionMinutes: minutes } });
      setProposal(p); setInterp(p.interpretation);
    } catch (e) { setError(e instanceof ApiError ? e.message : "Could not interpret the goal. Your wording is kept; try again."); }
    finally { setBusy(null); }
  };

  const saveInterp = async () => {
    if (!proposal) return;
    setBusy("edit"); setError(null);
    try { const p = await api<Proposal>(`/api/goals/${proposal.goalVersionId}/interpretation`, { method: "PATCH", body: { interpretation: interp } }); setProposal(p); setEditing(false); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Could not save."); }
    finally { setBusy(null); }
  };

  const clarify = async (answer: string | null) => {
    if (!proposal) return;
    setBusy("clarify"); setError(null);
    try { const p = await api<Proposal>(`/api/goals/${proposal.goalVersionId}/clarify`, { body: { answer } }); setProposal(p); setInterp(p.interpretation); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Could not save."); }
    finally { setBusy(null); }
  };

  const correctFact = async () => {
    if (!factEdit || !proposal) return;
    setBusy("fact"); setError(null);
    try {
      await api(`/api/profile/facts/${factEdit.id}`, { method: "PATCH", body: { value: factEdit.value } });
      const p = await api<Proposal>(`/api/goals/${proposal.goalVersionId}/interpretation`, { method: "PATCH", body: { interpretation: proposal.interpretation } });
      setProposal(p); setFactEdit(null);
    } catch (e) { setError(e instanceof ApiError ? e.message : "Could not save the correction."); }
    finally { setBusy(null); }
  };

  const start = async () => {
    if (!proposal) return;
    setBusy("start"); setError(null);
    try {
      if (minutes !== sessionMinutes) await api("/api/profile/preferences", { method: "PATCH", body: { sessionMinutes: minutes } });
      const r = await api<{ assignmentId: string | null }>(`/api/goals/${proposal.goalVersionId}/activate`, { body: {} });
      router.push(r.assignmentId ? `/learn/${r.assignmentId}` : "/today");
    } catch (e) { setError(e instanceof ApiError ? e.message : "Could not start. Your goal is saved; try again."); setBusy(null); }
  };

  return (
    <div className="stack" style={{ marginTop: 24 }}>
      <div className="row" role="group" aria-label="Suggested goals">
        {suggestions.map((s) => (
          <button key={s.id} className="chip" aria-pressed={picked === s.id} onClick={() => { setPicked(s.id); setText(s.text); setProposal(null); }}>{s.label}</button>
        ))}
      </div>
      <label className="field">
        <span>Your goal, in your own words</span>
        <span className="help">Choosing a suggestion writes editable text here; it does not assign a fixed route.</span>
        <textarea value={text} onChange={(e) => { setText(e.target.value); setPicked(null); setProposal(null); }} rows={3} maxLength={1000} placeholder="For example: I want to understand AI papers eventually" />
      </label>
      {!proposal && <button className="btn btn-primary btn-lg" onClick={interpret} disabled={busy !== null || text.trim().length < 5}>{busy === "interpret" ? "Interpreting…" : "Continue"}</button>}

      {error && <p className="alert error" role="alert">{error}</p>}

      {proposal && !proposal.inScope && (
        <section className="card" role="status">
          <h2 style={{ fontSize: 20, lineHeight: "28px" }}>That goal is outside what this product teaches</h2>
          <p className="prose">{proposal.aiReformulation}</p>
          <div className="row">
            <button className="btn btn-secondary" onClick={() => { setText("Use AI confidently in my work"); setProposal(null); }}>Use the AI interpretation</button>
            <button className="btn btn-ghost" onClick={() => setProposal(null)}>Write a different goal</button>
          </div>
        </section>
      )}

      {proposal && proposal.inScope && (
        <section className="card stack" aria-labelledby="proposal-heading" role="status">
          <div>
            <div className="eyebrow">Your destination: {proposal.destinationLabel}</div>
            <h2 id="proposal-heading" style={{ fontSize: 20, lineHeight: "28px" }}>{proposal.firstMilestone ? `Your first milestone: ${proposal.firstMilestone.title.toLowerCase()}` : "Your first milestone is not yet published"}</h2>
            {proposal.firstMilestone && <p className="prose">{proposal.firstMilestone.outcome} <span className="muted">Demonstrated by: {proposal.firstMilestone.evidenceRequirement}</span></p>}
            {proposal.researchNote && <p className="alert info">{proposal.researchNote}</p>}
            {proposal.coverage.gapNote && !proposal.researchNote && <p className="small muted">{proposal.coverage.gapNote}</p>}
          </div>

          <div>
            <div className="field-label">How we read your goal {proposal.provisional && <span className="badge caution">Provisional</span>}</div>
            {editing ? (
              <div className="stack-sm">
                <textarea value={interp} onChange={(e) => setInterp(e.target.value)} rows={2} maxLength={300} aria-label="Interpretation" />
                <div className="row"><button className="btn btn-secondary" onClick={saveInterp} disabled={busy !== null}>Save</button><button className="btn btn-ghost" onClick={() => { setEditing(false); setInterp(proposal.interpretation); }}>Cancel</button></div>
              </div>
            ) : (
              <p className="row" style={{ justifyContent: "space-between" }}><span>{proposal.interpretation}</span><button className="btn btn-ghost" onClick={() => setEditing(true)}>Edit</button></p>
            )}
            <p className="small muted">Your original words are kept: “{proposal.originalText}”. {proposal.interpreter === "rules" ? "Interpreted with reviewed goal mappings." : "Interpreted by the model and checked against the published catalogue."}</p>
          </div>

          {proposal.clarifyingQuestion && (
            <div className="alert info">
              <p><strong>{proposal.clarifyingQuestion}</strong> <span className="muted small">Optional. Skipping starts with broad foundations.</span></p>
              <div className="inline-actions">
                {["Use AI in my daily work", "Decide what to invest in", "Build something", "Understand how it works"].map((o) => <button key={o} className="chip" onClick={() => clarify(o)} disabled={busy !== null}>{o}</button>)}
                <button className="btn btn-ghost" onClick={() => clarify(null)} disabled={busy !== null}>Skip</button>
              </div>
            </div>
          )}

          <div>
            <div className="field-label">Context we will use for early examples</div>
            {proposal.contextFacts.length === 0 ? (
              <p className="muted">No personal context yet, so the first lesson uses a general example. You can add context later from Your profile.</p>
            ) : (
              <div>
                {proposal.contextFacts.map((f) => (
                  <div key={f.id} className="fact-row">
                    {factEdit?.id === f.id ? (
                      <>
                        <input type="text" aria-label="Correct this fact" value={factEdit.value} onChange={(e) => setFactEdit({ id: f.id, value: e.target.value })} className="value" />
                        <button className="btn btn-secondary" onClick={correctFact} disabled={busy !== null}>Save</button>
                        <button className="btn btn-ghost" onClick={() => setFactEdit(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <span className="value"><span className="badge neutral" style={{ marginRight: 8 }}>{f.sourceType === "cv" ? "From your CV" : f.sourceType === "manual" ? "You wrote this" : "Edited by you"}</span>{f.value}</span>
                        <button className="btn btn-ghost" onClick={() => setFactEdit({ id: f.id, value: f.value })}>Correct</button>
                      </>
                    )}
                  </div>
                ))}
                <p className="small muted">We&apos;ll use this for early examples. It does not grant any skill.</p>
              </div>
            )}
          </div>

          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="field-label">Time per session <span className="muted small">(editable any time)</span></legend>
            <div className="row">
              {[10, 20, 40].map((m) => <button key={m} className="chip" aria-pressed={minutes === m} onClick={() => setMinutes(m as 10 | 20 | 40)}>{m} minutes</button>)}
            </div>
          </fieldset>

          <details>
            <summary>See the full path ({proposal.milestones.filter((m) => m.status === "published").length} available, {proposal.milestones.filter((m) => m.status === "planned").length} planned)</summary>
            <ol className="stack-sm" style={{ paddingLeft: 20 }}>
              {proposal.milestones.map((m) => <li key={m.id}>{m.title} <span className={`badge ${m.status === "planned" ? "planned" : m.optional ? "neutral" : ""}`}>{m.status === "planned" ? "Planned" : m.optional ? "Optional depth" : "Available"}</span></li>)}
            </ol>
          </details>

          <div className="row">
            <button className="btn btn-primary btn-lg" onClick={start} disabled={busy !== null || !proposal.firstMilestone}>{busy === "start" ? "Preparing your first lesson…" : "Start my first lesson"}</button>
            <button className="btn btn-ghost" onClick={() => setProposal(null)}>Change goal</button>
          </div>
        </section>
      )}
    </div>
  );
}
