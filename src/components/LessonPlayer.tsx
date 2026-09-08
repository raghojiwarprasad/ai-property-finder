"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError, local, newKey } from "@/lib/api";
import type { ActivityView } from "@/server/services/learning";
import { Diagram } from "./Diagram";
import { TutorPanel, type TutorMessage } from "./TutorPanel";

type SubmitResult = {
  attemptId: string; replayed: boolean; assisted: boolean; independentEvidence: boolean; capabilityState: string | null; milestoneCompleted: string | null;
  evaluation: { id: string; result: string; status: string; summary: string; mainGap: string | null; nextMove: string | null; criteria: Array<{ id: string; label: string; critical: boolean; status: string }>; evaluator: string; provisionalReason: string | null };
  next: { assignmentId: string | null; reasonCode: string; reasonText: string } | null;
};

const REASON_LABEL: Record<string, string> = {
  TEACH_FIRST: "First capability", TEACH_NEXT: "Next capability", CHECK_INDEPENDENT: "Independent check", VERIFY_TRANSFER: "Transfer task", REVIEW_DUE: "Review", REPAIR_MISCONCEPTION: "Targeted repair",
  REDUCE_SUPPORT: "Smaller step", FRESH_VARIANT_AFTER_ASSISTANCE: "Fresh variant", LEARNER_CLAIM_CHECK: "Your check", PREREQUISITE_CHECK: "Prerequisite check", REPAIR_PREREQUISITE: "Prerequisite repair",
  CHECK_FAMILIARITY: "Quick check", ARTEFACT_REQUIRED: "Make something reusable", RESUME: "Resumed",
};

export function LessonPlayer({ initial, initialThread }: { initial: ActivityView; initialThread: TutorMessage[] }) {
  const router = useRouter();
  const [view, setView] = useState(initial);
  const { assignment, lesson, item } = view;
  const [explain, setExplain] = useState<"standard" | "simpler" | "deeper">("standard");
  const [tutorOpen, setTutorOpen] = useState(false);
  const [selection, setSelection] = useState<string | null>(null);
  const [blockId, setBlockId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [showFitMenu, setShowFitMenu] = useState(false);
  const [confidence, setConfidence] = useState<"sure" | "unsure" | null>(null);

  // Draft state with autosave, revision tracking and an offline retry queue (PRD-03 F02, PRD-14 F02).
  const draftKey = `lai:draft:${assignment.id}`;
  const [draft, setDraft] = useState<Record<string, unknown>>(() => view.draft?.content ?? {});
  const [revision, setRevision] = useState(view.draft?.revision ?? 0);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved" | "offline" | "conflict">("saved");
  const [conflictServer, setConflictServer] = useState<Record<string, unknown> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idemRef = useRef<string>(newKey());
  const scrollRestore = useRef<number>(0);

  useEffect(() => {
    // Restore an unsynced local draft if it is newer than the server copy (per-device convenience).
    const timer = setTimeout(() => {
      const raw = local.get(draftKey);
      if (raw && item) {
        try {
          const parsed = JSON.parse(raw) as { content: Record<string, unknown>; revision: number; unsynced?: boolean };
          if (parsed.unsynced && parsed.revision >= revision) { setDraft(parsed.content); setSaveState("unsaved"); }
        } catch { /* ignore */ }
      }
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistDraft = useCallback(async (content: Record<string, unknown>, rev: number) => {
    if (!item) return;
    setSaveState("saving");
    try {
      const r = await api<{ revision: number; conflict: boolean; server?: Record<string, unknown> }>(`/api/activities/${assignment.id}/draft`, { method: "PUT", body: { itemId: item.id, content, revision: rev } });
      if (r.conflict) { setSaveState("conflict"); setConflictServer(r.server ?? null); setRevision(r.revision); return; }
      setRevision(r.revision);
      local.set(draftKey, JSON.stringify({ content, revision: r.revision, unsynced: false }));
      setSaveState("saved");
    } catch (e) {
      local.set(draftKey, JSON.stringify({ content, revision: rev, unsynced: true }));
      setSaveState(e instanceof ApiError && e.code === "offline" ? "offline" : "unsaved");
    }
  }, [assignment.id, item, draftKey]);

  const updateDraft = (patch: Record<string, unknown>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    setSaveState("unsaved");
    local.set(draftKey, JSON.stringify({ content: next, revision, unsynced: true }));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void persistDraft(next, revision), 800);
  };

  useEffect(() => {
    const onOnline = () => { if (saveState === "offline" || saveState === "unsaved") void persistDraft(draft, revision); };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [saveState, draft, revision, persistDraft]);

  const refresh = async () => {
    const v = await api<ActivityView>(`/api/activities/${assignment.id}`);
    setView(v);
    return v;
  };

  const assistance = async (kind: "hint_1" | "hint_2" | "hint_3" | "worked_answer" | "explain_differently" | "go_deeper") => {
    setBusy(kind); setError(null);
    try {
      await api(`/api/activities/${assignment.id}/assistance`, { body: { kind } });
      await refresh();
      if (kind === "explain_differently") setExplain((e) => (e === "simpler" ? "standard" : "simpler"));
      if (kind === "go_deeper") setExplain((e) => (e === "deeper" ? "standard" : "deeper"));
    } catch (e) { setError(e instanceof ApiError ? e.message : "Could not do that."); }
    finally { setBusy(null); }
  };

  const nextHint = () => {
    const n = view.hintsRevealed.length;
    if (!item || n >= item.hints.length) return;
    void assistance(`hint_${n + 1}` as "hint_1" | "hint_2" | "hint_3");
  };

  const claimKnown = async () => {
    setBusy("known"); setError(null);
    try {
      const r = await api<{ assignmentId: string | null }>(`/api/activities/${assignment.id}/claim-known`, { body: {} });
      router.push(r.assignmentId ? `/learn/${r.assignmentId}` : "/today");
    } catch (e) { setError(e instanceof ApiError ? e.message : "Could not offer a check."); setBusy(null); }
  };

  const rejectExample = async (scope: "this_lesson" | "all") => {
    setBusy("reject"); setError(null); setShowFitMenu(false);
    try { await api(`/api/activities/${assignment.id}/reject-example`, { body: { scope } }); await refresh(); setNotice(scope === "all" ? "Personal examples are off. You can turn them back on in Your profile. Nothing you demonstrated has changed." : "This lesson now uses a general example. Your profile is unchanged."); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Could not change the example."); }
    finally { setBusy(null); }
  };

  const continueWithoutTask = async () => {
    setBusy("continue"); setError(null);
    try {
      const r = await api<{ assignmentId: string | null }>(`/api/activities/${assignment.id}/continue`, { body: {} });
      router.push(r.assignmentId ? `/learn/${r.assignmentId}` : "/today");
    } catch (e) { setError(e instanceof ApiError ? e.message : "Could not continue."); setBusy(null); }
  };

  const canSubmit = useMemo(() => {
    if (!item) return false;
    if (item.prompt.kind === "selected") return typeof draft.optionId === "string" && draft.optionId.length > 0;
    if (item.prompt.kind === "written") return String(draft.text ?? "").trim().length >= 1;
    return item.prompt.fields.some((f) => String(draft[f.id] ?? "").trim().length > 0);
  }, [draft, item]);

  const submit = async () => {
    if (!item) return;
    setBusy("submit"); setError(null);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    try {
      const r = await api<SubmitResult>("/api/attempts", { body: { assignmentId: assignment.id, itemId: item.id, itemVersion: item.version, submission: draft, idempotencyKey: idemRef.current, confidence } });
      setResult(r);
      local.remove(draftKey);
      if (r.evaluation.status === "final") idemRef.current = newKey();
      await refresh();
      scrollRestore.current = window.scrollY;
      document.getElementById("feedback")?.focus();
    } catch (e) {
      setError(e instanceof ApiError ? (e.code === "offline" ? "You appear to be offline. Your answer is kept on this page; submit again when you reconnect." : e.message) : "Could not submit. Your answer is kept; try again.");
    } finally { setBusy(null); }
  };

  const appeal = async () => {
    if (!result) return;
    const reason = window.prompt("Say briefly what you think was marked incorrectly. The original grade is preserved.");
    if (!reason) return;
    try { const r = await api<{ note: string }>(`/api/attempts/${result.attemptId}/appeal`, { body: { reason } }); setNotice(r.note); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Could not record the challenge."); }
  };

  const captureSelection = (id: string) => {
    const sel = window.getSelection()?.toString().trim() ?? "";
    setSelection(sel.length > 0 ? sel.slice(0, 1000) : null);
    setBlockId(id);
  };

  const isAssessedWork = Boolean(item) && assignment.state !== "completed" && !result;
  const bridge = lesson?.bridge;
  const conceptBlocks = lesson?.blocks ?? [];
  const cap = assignment.capabilityTitle;
  const stateLabel = saveState === "saved" ? (item ? "Draft saved" : "") : saveState === "saving" ? "Saving…" : saveState === "offline" ? "Offline: draft kept on this device, will retry" : saveState === "conflict" ? "Newer draft exists elsewhere" : "Unsaved changes";

  return (
    <div className={`lesson-layout${tutorOpen ? " with-tutor" : ""}`}>
      <div style={{ minWidth: 0 }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
          <Link href="/today" className="btn btn-ghost">← Today</Link>
          <span className="small muted">{assignment.milestoneTitle}</span>
          <span className="status-line" role="status" aria-live="polite">{stateLabel}</span>
        </div>
        <div className="eyebrow">{REASON_LABEL[assignment.reasonCode] ?? "Activity"} · {cap}</div>
        <h1 style={{ fontSize: 32, lineHeight: "40px" }}>{lesson?.title ?? item?.title ?? cap}</h1>
        {!lesson && item && <p className="prose muted">{assignment.reasonText}</p>}

        {notice && <p className="alert info" role="status">{notice}</p>}
        {error && <p className="alert error" role="alert">{error}</p>}

        {lesson && (
          <article className="stack prose" style={{ marginTop: 16 }}>
            <p className="muted" style={{ fontSize: 16 }}>{lesson.outcome} · About {lesson.durationMinutes[0]}–{lesson.durationMinutes[1]} minutes</p>
            {bridge && (
              <div className="bridge" onMouseUp={() => captureSelection("bridge")}>
                <div className="label">Start with something you know</div>
                {bridge.blocks?.map((b, i) => <p key={i} className={b.kind === "note" ? "note" : undefined}>{b.text}</p>)}
                <p className="note">
                  {bridge.mode === "personal" ? bridge.label : "General example"}{bridge.source === "fixture" ? " · Development fixture: reviewed template, not a live model" : bridge.source === "live" ? " · Personal example prepared by the model and validated" : ""}.
                  {" "}
                  <button className="btn btn-ghost" style={{ minHeight: 32, padding: "0 6px", fontSize: 15 }} onClick={() => setShowFitMenu((s) => !s)} aria-expanded={showFitMenu}>This example doesn&apos;t fit me</button>
                </p>
                {showFitMenu && (
                  <div className="inline-actions" role="group" aria-label="Change the example">
                    <button className="btn btn-secondary" onClick={() => rejectExample("this_lesson")} disabled={busy !== null}>Use a general example for this lesson</button>
                    <Link className="btn btn-secondary" href="/profile">Correct my profile</Link>
                    <button className="btn btn-ghost" onClick={() => rejectExample("all")} disabled={busy !== null}>Turn off personal examples</button>
                  </div>
                )}
              </div>
            )}
            {conceptBlocks.map((b) => {
              if (b.type === "orientation") return <p key={b.id} className="muted" onMouseUp={() => captureSelection(b.id)}>{b.text}</p>;
              if (b.type === "concept") {
                const text = explain === "simpler" ? lesson.simplerExplanation : explain === "deeper" ? lesson.deeperExplanation : b.text;
                return (
                  <section key={b.id} onMouseUp={() => captureSelection(b.id)} aria-live="polite">
                    {b.heading && <h2>{explain === "simpler" ? "In plain words" : explain === "deeper" ? "Going deeper" : b.heading}</h2>}
                    <p>{text}</p>
                    {explain !== "standard" && <button className="btn btn-ghost" onClick={() => setExplain("standard")}>Back to the standard explanation</button>}
                  </section>
                );
              }
              if (b.type === "example") return (
                <section key={b.id} onMouseUp={() => captureSelection(b.id)}>
                  <h3>{b.heading}</h3>
                  {b.sources?.map((s) => <div key={s.label} className="source" style={{ marginBottom: 8 }}><span className="label">{s.label}</span>{s.text}</div>)}
                  <p>{b.text}</p>
                </section>
              );
              if (b.type === "diagram") return <Diagram key={b.id} svgKey={b.svgKey} title={b.title} alt={b.alt} />;
              if (b.type === "nextStep") return null;
              return null;
            })}
            {lesson.misconceptions.length > 0 && explain === "deeper" && (
              <details><summary>Common misconceptions</summary><ul>{lesson.misconceptions.map((m) => <li key={m.id}><strong>{m.claim}</strong> {m.repair}</li>)}</ul></details>
            )}
          </article>
        )}

        {item && (
          <section className="card" style={{ marginTop: 24 }} aria-labelledby="task-heading">
            <div className="eyebrow">{item.taskKind === "transfer" ? "Transfer task: a new situation" : assignment.activityType === "review" ? "Quick review" : "Your task"}</div>
            <h2 id="task-heading" style={{ fontSize: 22, lineHeight: "30px" }}>{item.title}</h2>
            <p className="prose">{item.objective}</p>
            {item.supplied.map((s) => <div key={s.label} className="source" style={{ marginBottom: 8 }}><span className="label">{s.label}</span>{s.text}</div>)}
            <p className="small muted">Success looks like: {item.successCriteria}</p>
            <p className="prose" style={{ marginTop: 12 }}><strong>{item.prompt.question}</strong></p>
            {item.prompt.kind === "written" && item.prompt.guidance && <p className="small muted">{item.prompt.guidance}</p>}

            {!result && (
              <>
                {item.prompt.kind === "selected" && (
                  <fieldset style={{ border: 0, padding: 0, margin: "12px 0" }}>
                    <legend className="visually-hidden">Options</legend>
                    {item.prompt.options.map((o) => (
                      <label key={o.id} className="option"><input type="radio" name="option" value={o.id} checked={draft.optionId === o.id} onChange={() => updateDraft({ optionId: o.id })} /><span>{o.text}</span></label>
                    ))}
                    {item.prompt.allowUnsure && <label className="option"><input type="radio" name="option" value="unsure" checked={draft.optionId === "unsure"} onChange={() => updateDraft({ optionId: "unsure" })} /><span>I&apos;m not sure</span></label>}
                  </fieldset>
                )}
                {item.prompt.kind === "written" && (
                  <label className="field"><span className="visually-hidden">Your answer</span><textarea rows={7} value={String(draft.text ?? "")} onChange={(e) => updateDraft({ text: e.target.value })} placeholder="Write what you would check or change…" /></label>
                )}
                {item.prompt.kind === "worksheet" && item.prompt.fields.map((f) => (
                  <label key={f.id} className="field"><span>{f.label}</span>{f.multiline ? <textarea rows={4} value={String(draft[f.id] ?? "")} onChange={(e) => updateDraft({ [f.id]: e.target.value })} placeholder={f.placeholder} /> : <input type="text" value={String(draft[f.id] ?? "")} onChange={(e) => updateDraft({ [f.id]: e.target.value })} placeholder={f.placeholder} />}</label>
                ))}
                {saveState === "conflict" && conflictServer && (
                  <div className="alert caution" role="alert">
                    <p>A newer draft was saved from another device or tab.</p>
                    <div className="inline-actions"><button className="btn btn-secondary" onClick={() => { setDraft(conflictServer); setSaveState("saved"); setConflictServer(null); }}>Use the newer draft</button><button className="btn btn-secondary" onClick={() => { setConflictServer(null); void persistDraft(draft, revision); }}>Keep mine</button></div>
                  </div>
                )}
                {item.prompt.kind !== "selected" && (
                  <div className="row" role="group" aria-label="How confident are you?">
                    <span className="small muted">Confidence (optional):</span>
                    <button className="chip" aria-pressed={confidence === "sure"} onClick={() => setConfidence(confidence === "sure" ? null : "sure")}>Fairly sure</button>
                    <button className="chip" aria-pressed={confidence === "unsure"} onClick={() => setConfidence(confidence === "unsure" ? null : "unsure")}>Not sure</button>
                  </div>
                )}
                {view.hintsRevealed.length > 0 && <div className="alert info" role="status"><strong>Hints</strong><ol style={{ margin: "4px 0 0", paddingLeft: 20 }}>{view.hintsRevealed.map((h) => <li key={h}>{h}</li>)}</ol></div>}
                {view.workedAnswer && <div className="alert caution" role="status"><strong>Worked answer</strong><p style={{ marginTop: 4 }}>{view.workedAnswer}</p><p className="small">Submitting now is recorded as assisted; a fresh variant will be used for independent evidence.</p></div>}
                <div className="row" style={{ marginTop: 12 }}>
                  <button className="btn btn-primary btn-lg" onClick={submit} disabled={!canSubmit || busy !== null}>{busy === "submit" ? "Checking…" : "Check my answer"}</button>
                  {view.hintsRevealed.length < item.hints.length && <button className="btn btn-secondary" onClick={nextHint} disabled={busy !== null}>Give me a hint</button>}
                  {!view.workedAnswer && item.prompt.kind !== "selected" && <button className="btn btn-ghost" onClick={() => assistance("worked_answer")} disabled={busy !== null}>Show a worked answer (marks as assisted)</button>}
                </div>
                {view.attemptsOnItem > 0 && view.latest && (
                  <div className="alert info" style={{ marginTop: 12 }} role="status">
                    <p><strong>Your earlier attempt:</strong> {view.latest.summary} {view.latest.mainGap && <span>{view.latest.mainGap}</span>}</p>
                    <p className="small">{view.latest.status === "provisional" ? "That attempt is saved and awaiting review; you can revise now." : "Revise and submit again; the earlier attempt stays on record."}</p>
                  </div>
                )}
              </>
            )}

            {result && (
              <div id="feedback" tabIndex={-1} className={`alert ${result.evaluation.result === "pass" ? "success" : result.evaluation.status === "provisional" ? "caution" : "info"}`} role="status" aria-live="polite" style={{ marginTop: 12 }}>
                <p style={{ fontSize: 18 }}><strong>{result.evaluation.summary}</strong>{result.replayed && <span className="small"> (already recorded)</span>}</p>
                {result.evaluation.mainGap && <p><strong>The main gap:</strong> {result.evaluation.mainGap}</p>}
                {result.evaluation.nextMove && <p><strong>One next move:</strong> {result.evaluation.nextMove}</p>}
                {result.evaluation.provisionalReason && <p className="small">{result.evaluation.provisionalReason}</p>}
                <details><summary>What was checked</summary>
                  <ul className="criteria">{result.evaluation.criteria.map((c) => <li key={c.id}><span className={`mark ${c.status}`} aria-hidden="true">{c.status === "met" ? "✓" : c.status === "uncertain" ? "?" : "✗"}</span><span><span className="visually-hidden">{c.status === "met" ? "Supported: " : c.status === "uncertain" ? "Uncertain: " : "Missing: "}</span>{c.label}{c.critical ? " (critical)" : ""}</span></li>)}</ul>
                  <p className="small muted">Evaluator: {result.evaluation.evaluator === "model" ? "model judgement with span validation" : result.evaluation.evaluator === "deterministic" ? "reviewed deterministic check" : result.evaluation.evaluator}. {result.assisted ? "This attempt used assistance, so it is recorded as assisted." : result.independentEvidence ? "This counts as independent evidence." : result.evaluation.status === "final" ? "This attempt does not add new independent evidence (a repeated question or review)." : ""}</p>
                </details>
                <div className="row" style={{ marginTop: 12 }}>
                  {result.evaluation.status === "provisional" && <button className="btn btn-secondary" onClick={() => { setResult(null); idemRef.current = newKey(); }}>Revise my answer</button>}
                  {result.evaluation.status === "final" && result.evaluation.result !== "pass" && result.next?.assignmentId && <Link className="btn btn-primary" href={`/learn/${result.next.assignmentId}`}>Continue: {result.next.reasonText.split(".")[0]}</Link>}
                  {result.evaluation.status === "final" && result.evaluation.result === "pass" && result.next?.assignmentId && <Link className="btn btn-primary" href={`/learn/${result.next.assignmentId}`}>Next: {result.next.reasonText.split(".")[0]}</Link>}
                  {result.evaluation.status === "final" && !result.next?.assignmentId && <Link className="btn btn-primary" href="/today">Back to Today</Link>}
                  <button className="btn btn-ghost" onClick={appeal}>I think this was marked incorrectly</button>
                </div>
                {result.milestoneCompleted && <p className="small" style={{ marginTop: 8 }}>You completed the milestone “{result.milestoneCompleted}”. See what you demonstrated in My path.</p>}
                {result.evaluation.status === "final" && <p className="small muted" style={{ marginTop: 8 }}>Save this progress to an account? <Link href="/account">Keep this work and continue on another device.</Link></p>}
              </div>
            )}
          </section>
        )}

        {lesson && !item && (
          <div className="row" style={{ marginTop: 24 }}>
            <button className="btn btn-primary btn-lg" onClick={continueWithoutTask} disabled={busy !== null}>Continue</button>
            <span className="small muted">Reading counts as exposure only; the next activity checks the idea.</span>
          </div>
        )}
        {lesson && item && !result && assignment.state !== "completed" && (
          <p className="small muted" style={{ marginTop: 16 }}>Not ready to answer? <button className="btn btn-ghost" onClick={continueWithoutTask} disabled={busy !== null}>Continue without the task</button> The capability will show as introduced, not demonstrated.</p>
        )}
      </div>

      <aside className="help-panel" aria-label="Help with this idea">
        {tutorOpen ? (
          <TutorPanel assignmentId={assignment.id} initial={initialThread} selection={selection} blockId={blockId} onClose={() => { setTutorOpen(false); window.scrollTo({ top: scrollRestore.current }); }} onAssistance={() => void refresh()} isAssessedWork={isAssessedWork} />
        ) : (
          <div className="card compact">
            <h3>Help with this idea</h3>
            <p className="small muted">You stay in control.</p>
            {lesson && <button className="btn btn-secondary" onClick={() => assistance("explain_differently")} disabled={busy !== null}>Explain differently</button>}
            {item && !result && <button className="btn btn-secondary" onClick={nextHint} disabled={busy !== null || view.hintsRevealed.length >= item.hints.length}>Give me a hint</button>}
            {lesson && <button className="btn btn-secondary" onClick={() => assistance("go_deeper")} disabled={busy !== null}>Go deeper</button>}
            {lesson && !result && <button className="btn btn-secondary" onClick={claimKnown} disabled={busy !== null}>I know this</button>}
            <button className="btn btn-primary" onClick={() => { scrollRestore.current = window.scrollY; setTutorOpen(true); }}>Ask the tutor</button>
            <p className="small muted" style={{ marginTop: 8 }}>Select a sentence first and the tutor will explain that sentence.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
