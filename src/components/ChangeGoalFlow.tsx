"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

type DestinationChoice = { id: string; label: string; description: string };
type Preview = {
  carried: Array<{ capabilityId: string; title: string; state: string }>;
  newRequirements: Array<{ capabilityId: string; title: string; state: string }>;
  planned: string[];
};
type Proposal = { goalVersionId: string; interpretation: string; destination: string; destinationLabel: string; inScope: boolean; aiReformulation: string | null };

const STATE_WORDS: Record<string, string> = { demonstrated: "demonstrated", practising: "practising", needs_review: "review due", introduced: "introduced", unknown: "not started" };

/**
 * Pick a destination, see what carries over, then confirm the new goal wording.
 * Calls only the JSON API: preview-change, goals (interpret), goals/:id/activate.
 */
export function ChangeGoalFlow({ destinations, currentDestination }: { destinations: DestinationChoice[]; currentDestination: string | null }) {
  const router = useRouter();
  const [destination, setDestination] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [text, setText] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState<"idle" | "interpreting" | "activating">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, setPending] = useState<Proposal | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadPreview = (id: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setPreview(null);
    setPreviewError(null);
    setPreviewLoading(true);
    api<Preview>("/api/goals/preview-change", { method: "POST", body: { destination: id }, signal: ctrl.signal })
      .then((p) => { if (!ctrl.signal.aborted) setPreview(p); })
      .catch((e) => { if (!(e instanceof ApiError && e.code === "cancelled")) setPreviewError(e instanceof ApiError ? e.message : "Could not load the preview."); })
      .finally(() => { if (!ctrl.signal.aborted) setPreviewLoading(false); });
  };

  const choose = (id: string) => {
    setDestination(id);
    setPending(null);
    setSubmitError(null);
    if (!touched) setText(destinations.find((d) => d.id === id)?.label ?? "");
    loadPreview(id);
  };

  const activate = async (goalVersionId: string) => {
    setSubmitting("activating");
    try {
      await api(`/api/goals/${goalVersionId}/activate`, { method: "POST", body: {} });
      router.push("/today");
      router.refresh();
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : "Could not activate the goal. Your wording is kept; try again.");
      setSubmitting("idle");
    }
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!destination) return;
    setSubmitError(null);
    setPending(null);
    setSubmitting("interpreting");
    try {
      const proposal = await api<Proposal>("/api/goals", { method: "POST", body: { text } });
      if (!proposal.inScope) {
        setSubmitError(proposal.aiReformulation ?? "That wording is outside what this product teaches. Edit it to describe an AI goal.");
        setSubmitting("idle");
        return;
      }
      if (proposal.destination !== destination) {
        setPending(proposal);
        setSubmitting("idle");
        return;
      }
      await activate(proposal.goalVersionId);
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : "Could not save the goal. Your wording is kept; try again.");
      setSubmitting("idle");
    }
  };

  const selected = destinations.find((d) => d.id === destination) ?? null;
  const busy = submitting !== "idle";

  return (
    <div className="stack">
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="field-label">Where do you want to go?</legend>
        {destinations.map((d) => (
          <label key={d.id} className="option">
            <input type="radio" name="destination" value={d.id} checked={destination === d.id} onChange={() => choose(d.id)} disabled={busy} />
            <span>
              <strong>{d.label}</strong>{currentDestination === d.id ? <span className="badge neutral" style={{ marginLeft: 8 }}>Current</span> : null}
              <span className="muted small" style={{ display: "block" }}>{d.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {destination && (
        <section className="card" aria-labelledby="preview-heading" aria-busy={previewLoading}>
          <h2 id="preview-heading" style={{ fontSize: 20, lineHeight: "28px" }}>Before and after: {selected?.label}</h2>
          {previewLoading && <p className="status-line" role="status">Working out what carries over…</p>}
          {previewError && (
            <div className="alert error" role="alert">
              <p>{previewError}</p>
              <button type="button" className="btn btn-secondary" onClick={() => choose(destination)}>Try again</button>
            </div>
          )}
          {preview && (
            <div className="stack" role="status" aria-live="polite">
              <div>
                <h3 style={{ fontSize: 16, lineHeight: "24px" }}>Carries over ({preview.carried.length})</h3>
                {preview.carried.length === 0 ? <p className="muted">Nothing you have demonstrated so far is required by this destination. It stays in your work record either way.</p> : (
                  <ul className="trace">{preview.carried.map((c) => <li key={c.capabilityId} style={{ gridTemplateColumns: "1fr" }}><span>{c.title} <span className="muted small">· {STATE_WORDS[c.state] ?? c.state}</span></span></li>)}</ul>
                )}
              </div>
              <div>
                <h3 style={{ fontSize: 16, lineHeight: "24px" }}>New requirements ({preview.newRequirements.length})</h3>
                {preview.newRequirements.length === 0 ? <p className="muted">No new capabilities are required.</p> : (
                  <ul className="trace">{preview.newRequirements.map((c) => <li key={c.capabilityId} style={{ gridTemplateColumns: "1fr" }}><span>{c.title}</span></li>)}</ul>
                )}
              </div>
              <div>
                <h3 style={{ fontSize: 16, lineHeight: "24px" }}>Planned ({preview.planned.length})</h3>
                {preview.planned.length === 0 ? <p className="muted">Every milestone on this route is published.</p> : (
                  <>
                    <p className="muted small">These milestones are on the route but their content is not published yet. They cannot be launched.</p>
                    <ul className="trace">{preview.planned.map((t) => <li key={t} style={{ gridTemplateColumns: "1fr" }}><span>{t} <span className="badge planned" style={{ marginLeft: 6 }}>Planned</span></span></li>)}</ul>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {destination && (
        <form className="card" onSubmit={submit} aria-labelledby="wording-heading">
          <h2 id="wording-heading" style={{ fontSize: 20, lineHeight: "28px" }}>Your goal in your words</h2>
          <label className="field">
            <span>Goal wording</span>
            <span className="help">We suggested the destination’s label. Edit it to say what you actually want to do.</span>
            <input type="text" name="goal" value={text} onChange={(e) => { setText(e.target.value); setTouched(true); }} disabled={busy} required minLength={3} maxLength={1000} />
          </label>

          {pending && (
            <div className="alert caution" role="alert">
              <p>We read that wording as “{pending.destinationLabel}” rather than “{selected?.label}”. Interpretation: {pending.interpretation}</p>
              <div className="inline-actions">
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => activate(pending.goalVersionId)}>Change to {pending.destinationLabel}</button>
                <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setPending(null)}>Edit the wording</button>
              </div>
            </div>
          )}

          {submitError && <p className="alert error" role="alert">{submitError}</p>}

          <div className="row" style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={busy || text.trim().length < 3}>
              {submitting === "interpreting" ? "Reading your goal…" : submitting === "activating" ? "Changing your goal…" : "Change my goal"}
            </button>
            {busy && <span className="status-line" role="status">This keeps your demonstrated work and records the change on your path.</span>}
          </div>
        </form>
      )}
    </div>
  );
}
