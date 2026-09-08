"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { api, ApiError, local, newKey } from "@/lib/api";

/* Client-side mirrors of publicPractice() and RunResult from src/server/services/practice.ts. */
export type PracticeControl = { id: string; label: string; type: "number" | "select" | "toggle" | "text" | "multiselect"; options?: Array<{ value: string; label: string }>; default: unknown; help?: string };
export type PracticeScenario = { key: string; title: string; description: string; data: Record<string, unknown> };
export type PracticeTemplateView = { id: string; version: number; capabilityId: string; family: string; kind: string; title: string; simulates: string; objective: string; brief: string; hints: string[]; controls: PracticeControl[]; scenarios: PracticeScenario[] };
export type TraceLine = { step: number; subject: string; action: string; outcome: string; flag: "ok" | "risk" | "blocked" | "info" };
export type Criterion = { id: string; label: string; critical: boolean; status: "met" | "not_met" | "uncertain"; note: string | null };
export type RunView = { id: string; runNumber: number; scenarioKey: string; configuration: Record<string, unknown>; trace: TraceLine[]; outcome: { summary: string; criteria: Criterion[]; result: "pass" | "fail"; unsafeActions: number; heldRoutine: number }; createdAt: string };

type Submission = { attemptId: string; result: string; assisted: boolean; independent: boolean; summary: string; criteria: Criterion[]; next: { assignmentId: string | null; reasonCode: string; reasonText: string } | null; replayed: boolean };

const FLAG_WORD: Record<TraceLine["flag"], string> = { ok: "OK", risk: "Risk", blocked: "Blocked", info: "Info" };
const MARK: Record<Criterion["status"], string> = { met: "✓", not_met: "✕", uncertain: "?" };
const STATUS_WORD: Record<Criterion["status"], string> = { met: "Met", not_met: "Not met", uncertain: "Uncertain" };

function defaultsOf(controls: PracticeControl[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const c of controls) out[c.id] = Array.isArray(c.default) ? [...c.default] : c.default;
  return out;
}
function same(a: unknown, b: unknown): boolean { return JSON.stringify(a) === JSON.stringify(b); }
function display(c: PracticeControl, v: unknown): string {
  if (c.type === "toggle") return v ? "On" : "Off";
  if (c.type === "select") return c.options?.find((o) => o.value === v)?.label ?? String(v ?? "");
  if (c.type === "multiselect") { const arr = Array.isArray(v) ? v : []; return arr.length ? arr.map((x) => c.options?.find((o) => o.value === x)?.label ?? String(x)).join(", ") : "None"; }
  return String(v ?? "");
}

/**
 * S08 practice workspace (PRD-08). Brief, editable controls, run, observable trace, compare,
 * reset with confirmation, hints (assistance recorded server-side), and submission as evidence.
 * Every action in the trace is fictional; nothing here contacts a real service.
 */
export function PracticeWorkspace({ assignmentId, template, runs: initialRuns, milestoneTitle, capabilityTitle }: { assignmentId: string; template: PracticeTemplateView; runs: RunView[]; milestoneTitle: string; capabilityTitle: string }) {
  const storageKey = `lai:practice:${assignmentId}`;
  const defaults = useMemo(() => defaultsOf(template.controls), [template.controls]);
  const [scenarioKey, setScenarioKey] = useState(template.scenarios[0]?.key ?? "");
  const [config, setConfig] = useState<Record<string, unknown>>(defaults);
  const [restored, setRestored] = useState(false);
  const [runs, setRuns] = useState<RunView[]>(initialRuns);
  const [current, setCurrent] = useState<RunView | null>(null);
  const [submitKey, setSubmitKey] = useState<string>(() => newKey());
  const [compareId, setCompareId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState("");
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, startRun] = useTransition();
  const [submitting, startSubmit] = useTransition();
  const [hinting, startHint] = useTransition();
  const busy = running || submitting || hinting;

  // Per-device convenience: restore the last configuration, then keep it in sync.
  useEffect(() => {
    // Deferred so the server-rendered defaults hydrate first; the stored value is then applied once.
    let cancelled = false;
    const restore = () => {
      if (cancelled) return;
      const raw = local.get(storageKey);
      if (raw) {
        try {
          const saved = JSON.parse(raw) as { scenarioKey?: string; configuration?: Record<string, unknown>; hintsUsed?: number };
          if (saved.scenarioKey && template.scenarios.some((s) => s.key === saved.scenarioKey)) setScenarioKey(saved.scenarioKey);
          if (saved.configuration && typeof saved.configuration === "object") setConfig({ ...defaults, ...saved.configuration });
          if (typeof saved.hintsUsed === "number") setHintsUsed(Math.min(saved.hintsUsed, template.hints.length));
        } catch { /* ignore a corrupt value */ }
      }
      setRestored(true);
    };
    const id = window.setTimeout(restore, 0);
    return () => { cancelled = true; window.clearTimeout(id); };
  }, [storageKey, defaults, template.scenarios, template.hints.length]);
  useEffect(() => {
    if (!restored) return;
    local.set(storageKey, JSON.stringify({ scenarioKey, configuration: config, hintsUsed }));
  }, [restored, storageKey, scenarioKey, config, hintsUsed]);

  const scenario = template.scenarios.find((s) => s.key === scenarioKey) ?? template.scenarios[0];
  const dirty = !same(config, defaults);
  const base = current ?? runs[0] ?? null;
  const compared = compareId ? runs.find((r) => r.id === compareId) ?? null : null;
  const runLabel = template.kind === "approval_boundary" ? "Run the day" : "Run";

  function setControl(id: string, value: unknown): void { setConfig((c) => ({ ...c, [id]: value })); }

  function run(): void {
    setError(null);
    setStatus("Running the simulation…");
    startRun(async () => {
      try {
        const r = await api<{ runId: string; runNumber: number; scenarioKey: string; trace: TraceLine[]; outcome: RunView["outcome"] }>("/api/practice/runs", { body: { practiceId: template.id, scenarioKey, configuration: config, assignmentId } });
        const view: RunView = { id: r.runId, runNumber: r.runNumber, scenarioKey: r.scenarioKey, configuration: { ...config }, trace: r.trace, outcome: r.outcome, createdAt: new Date().toISOString() };
        setRuns((rs) => [view, ...rs]);
        setCurrent(view);
        setSubmitKey(newKey());
        setSubmission(null);
        setCompareId(null);
        setStatus(`Run ${r.runNumber} finished. ${r.outcome.summary}`);
      } catch (e) {
        setStatus(null);
        setError(e instanceof ApiError ? (e.code === "internal" ? `Execution problem, not a mistake in your configuration: ${e.message}` : e.message) : "The simulation could not run. Your configuration is kept; try again.");
      }
    });
  }

  function hint(): void {
    if (hintsUsed >= template.hints.length) return;
    setError(null);
    startHint(async () => {
      try {
        const kind = `hint_${hintsUsed + 1}`;
        const r = await api<{ assistance: string[] }>(`/api/activities/${assignmentId}/assistance`, { body: { kind } });
        const fromServer = (r.assistance ?? []).filter((k) => /^hint_\d$/.test(k)).length;
        setHintsUsed(Math.min(template.hints.length, Math.max(hintsUsed + 1, fromServer)));
        setStatus(`Hint ${hintsUsed + 1} shown.`);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Could not fetch a hint. Try again.");
      }
    });
  }

  function submit(): void {
    if (!current) return;
    setError(null);
    startSubmit(async () => {
      try {
        const r = await api<Submission>("/api/practice/submit", { body: { assignmentId, runId: current.id, explanation, idempotencyKey: submitKey } });
        setSubmission(r);
        setStatus(r.replayed ? "This run was already submitted; showing the recorded result." : "Submitted as evidence.");
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Could not submit. Your explanation is still here; try again.");
      }
    });
  }

  function reset(): void {
    setConfig(defaultsOf(template.controls));
    setConfirmReset(false);
    setStatus("Configuration reset to the defaults.");
  }

  return (
    <div className="stack">
      <header className="stack-sm">
        <div className="eyebrow">{milestoneTitle} · {capabilityTitle}</div>
        <div className="row" style={{ gap: 12 }}>
          <h1 style={{ fontSize: 28, lineHeight: "36px", margin: 0 }}>{template.title}</h1>
          <span className="badge caution">Simulation</span>
        </div>
        <p className="prose"><strong>Objective.</strong> {template.objective}</p>
        <p className="prose">{template.brief}</p>
        <p className="alert info small"><strong>What is simulated:</strong> {template.simulates} No payment, email, model call or other real action happens; nothing leaves this page.</p>
      </header>

      <section className="card" aria-labelledby="scenario-heading">
        <h2 id="scenario-heading" style={{ fontSize: 20, lineHeight: "28px" }}>Scenario</h2>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="visually-hidden">Choose a scenario</legend>
          {template.scenarios.map((s) => (
            <label key={s.key} className="option">
              <input type="radio" name="scenario" value={s.key} checked={scenarioKey === s.key} onChange={() => setScenarioKey(s.key)} disabled={busy} />
              <span><strong>{s.title}</strong><br /><span className="small muted">{s.description}</span></span>
            </label>
          ))}
        </fieldset>
        <ScenarioData kind={template.kind} data={scenario?.data ?? {}} />
      </section>

      <section className="card" aria-labelledby="controls-heading">
        <h2 id="controls-heading" style={{ fontSize: 20, lineHeight: "28px" }}>Your configuration</h2>
        <p className="small muted">Saved on this device only, so you can come back to it here. Each run is recorded with the configuration it used.</p>
        <form onSubmit={(e) => { e.preventDefault(); run(); }} className="stack-sm" style={{ marginTop: 12 }}>
          {template.controls.map((c) => <ControlField key={c.id} control={c} value={config[c.id]} onChange={(v) => setControl(c.id, v)} disabled={busy} />)}
          <div className="row" style={{ marginTop: 8 }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>{running ? "Running…" : runLabel}</button>
            {confirmReset ? (
              <span className="alert caution" role="group" aria-label="Confirm reset">
                <span className="small">Discard your changes and go back to the defaults?</span>{" "}
                <button type="button" className="btn btn-danger" onClick={reset} disabled={busy}>Discard and reset</button>{" "}
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Keep my changes</button>
              </span>
            ) : (
              <button type="button" className="btn btn-secondary" disabled={busy || !dirty} onClick={() => (dirty ? setConfirmReset(true) : reset())}>Reset configuration</button>
            )}
          </div>
        </form>
      </section>

      <section className="card muted-surface" aria-labelledby="hints-heading">
        <h2 id="hints-heading" style={{ fontSize: 20, lineHeight: "28px" }}>Stuck?</h2>
        <p className="small muted">Hints are recorded as support. Using two or more marks the attempt as assisted, so a fresh scenario will be needed for independent evidence.</p>
        {hintsUsed > 0 && (
          <ol style={{ margin: "8px 0 12px", paddingLeft: 20 }} aria-label="Hints shown">
            {template.hints.slice(0, hintsUsed).map((h, i) => <li key={i} style={{ marginBottom: 6 }}>{h}</li>)}
          </ol>
        )}
        <button type="button" className="btn btn-secondary" onClick={hint} disabled={busy || hintsUsed >= template.hints.length}>
          {hintsUsed >= template.hints.length ? "No more hints" : hintsUsed === 0 ? "Give me a hint" : `Give me hint ${hintsUsed + 1} of ${template.hints.length}`}
        </button>
      </section>

      <div role="status" aria-live="polite" className="status-line">{status ?? ""}</div>
      {error && <p className="alert error" role="alert">{error}</p>}

      {current && (
        <section className="card" aria-labelledby="result-heading">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 id="result-heading" style={{ fontSize: 20, lineHeight: "28px" }}>Result of run {current.runNumber}</h2>
            <span className={`badge ${current.outcome.result === "pass" ? "" : "caution"}`.trim()}>{current.outcome.result === "pass" ? "Criteria met" : "Not yet"}</span>
          </div>
          <p className="prose">{current.outcome.summary}</p>
          <h3 style={{ marginTop: 16 }}>What happened, step by step</h3>
          <p className="small muted">Every line is a fictional outcome computed from your configuration.</p>
          <TraceList trace={current.trace} changed={compared ? changedSteps(current.trace, compared.trace) : undefined} />
          <h3 style={{ marginTop: 16 }}>Criteria</h3>
          <CriteriaList criteria={current.outcome.criteria} />
        </section>
      )}

      {compared && base && (
        <section className="card" aria-labelledby="compare-heading">
          <h2 id="compare-heading" style={{ fontSize: 20, lineHeight: "28px" }}>Run {base.runNumber} compared with run {compared.runNumber}</h2>
          <div className="scroll-x">
            <table aria-label="Configuration comparison">
              <thead><tr><th scope="col">Setting</th><th scope="col">Run {base.runNumber}</th><th scope="col">Run {compared.runNumber}</th></tr></thead>
              <tbody>
                <tr><th scope="row">Scenario</th><td className={base.scenarioKey !== compared.scenarioKey ? "diff-added" : undefined}>{titleOf(template, base.scenarioKey)}</td><td className={base.scenarioKey !== compared.scenarioKey ? "diff-removed" : undefined}>{titleOf(template, compared.scenarioKey)}</td></tr>
                {template.controls.map((c) => {
                  const diff = !same(base.configuration[c.id], compared.configuration[c.id]);
                  return <tr key={c.id}><th scope="row">{c.label}</th><td className={diff ? "diff-added" : undefined}>{display(c, base.configuration[c.id])}{diff && <span className="visually-hidden"> (changed)</span>}</td><td className={diff ? "diff-removed" : undefined}>{display(c, compared.configuration[c.id])}</td></tr>;
                })}
                <tr><th scope="row">Result</th><td>{base.outcome.result === "pass" ? "Criteria met" : "Not yet"}</td><td>{compared.outcome.result === "pass" ? "Criteria met" : "Not yet"}</td></tr>
              </tbody>
            </table>
          </div>
          <h3 style={{ marginTop: 16 }}>Trace of run {compared.runNumber}</h3>
          <p className="small muted">{describeChanges(base.trace, compared.trace)}</p>
          <TraceList trace={compared.trace} changed={changedSteps(compared.trace, base.trace)} />
          <button type="button" className="btn btn-ghost" onClick={() => setCompareId(null)}>Close comparison</button>
        </section>
      )}

      {runs.length > 0 && (
        <section className="card" aria-labelledby="runs-heading">
          <h2 id="runs-heading" style={{ fontSize: 20, lineHeight: "28px" }}>Previous runs</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {runs.map((r) => (
              <li key={r.id} className="fact-row">
                <div className="value">
                  <strong>Run {r.runNumber}</strong> · {titleOf(template, r.scenarioKey)} · {r.outcome.result === "pass" ? "criteria met" : "not yet"}
                  {current?.id === r.id && <span className="badge" style={{ marginLeft: 8 }}>Current</span>}
                  <div className="small muted">{r.outcome.summary}</div>
                </div>
                <div className="inline-actions">
                  {current?.id !== r.id && <button type="button" className="btn btn-ghost" onClick={() => { setCurrent(r); setSubmitKey(newKey()); setSubmission(null); setCompareId(null); setStatus(`Showing run ${r.runNumber}.`); }}>Show this run</button>}
                  {base && base.id !== r.id && (
                    <button type="button" className="btn btn-ghost" aria-pressed={compareId === r.id} onClick={() => setCompareId(compareId === r.id ? null : r.id)}>
                      {compareId === r.id ? "Stop comparing" : "Compare with this run"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {current && (
        <section className="card" aria-labelledby="explain-heading">
          <h2 id="explain-heading" style={{ fontSize: 20, lineHeight: "28px" }}>Explain your decision</h2>
          <p className="small muted">Running a configuration is not evidence on its own. Say why you set the controls this way and what the trace shows (at least 30 characters).</p>
          {submission ? (
            <div className="stack-sm" role="status">
              <p className={`alert ${submission.result === "pass" ? "success" : "caution"}`}>
                <strong>{submission.result === "pass" ? "Demonstrated on this scenario." : "Not demonstrated yet."}</strong> {submission.summary}
              </p>
              <p className="small">
                {submission.independent ? "This counts as independent evidence." : "Recorded as evidence, but not as independent evidence"}
                {!submission.independent && (submission.assisted ? " because hints or a worked answer were used." : " because this scenario was already attempted.")}
                {submission.assisted && <> <span className="badge caution">Assisted</span></>}
                {!submission.independent && " A fresh scenario without hints can confirm it independently."}
              </p>
              <CriteriaList criteria={submission.criteria} />
              <div className="row" style={{ marginTop: 12 }}>
                {submission.next?.assignmentId ? (
                  <>
                    <Link className="btn btn-primary" href="/today">Continue</Link>
                    <span className="small muted">{submission.next.reasonText}</span>
                  </>
                ) : (
                  <Link className="btn btn-primary" href="/today">Back to Today</Link>
                )}
                <Link className="btn btn-secondary" href="/work">See your work</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="stack-sm">
              <label className="field">
                <span>Why did you set it this way, and what does run {current.runNumber} show?</span>
                <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={4} maxLength={2000} disabled={submitting} />
                <span className="small muted">{explanation.trim().length < 30 ? `${30 - explanation.trim().length} more characters needed.` : `${explanation.trim().length} characters.`}</span>
              </label>
              <div className="row">
                <button type="submit" className="btn btn-primary" disabled={busy || explanation.trim().length < 30}>{submitting ? "Submitting…" : "Submit as evidence"}</button>
                <span className="small muted">Submits run {current.runNumber} ({titleOf(template, current.scenarioKey)}).</span>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
}

function titleOf(t: PracticeTemplateView, key: string): string { return t.scenarios.find((s) => s.key === key)?.title ?? key; }

function changedSteps(a: TraceLine[], b: TraceLine[]): Set<number> {
  const out = new Set<number>();
  const byStep = new Map(b.map((l) => [l.step, l]));
  for (const l of a) {
    const o = byStep.get(l.step);
    if (!o || o.subject !== l.subject || o.action !== l.action || o.outcome !== l.outcome || o.flag !== l.flag) out.add(l.step);
  }
  return out;
}
function describeChanges(base: TraceLine[], other: TraceLine[]): string {
  const n = changedSteps(other, base).size + Math.max(0, base.length - other.length);
  return n === 0 ? "The trace is identical; the configuration change made no difference to this scenario." : `${n} step${n === 1 ? "" : "s"} differ. Changed lines are marked.`;
}

function TraceList({ trace, changed }: { trace: TraceLine[]; changed?: Set<number> }) {
  return (
    <ol className="trace" aria-label="Simulation trace">
      {trace.map((l) => {
        const isChanged = changed?.has(l.step) ?? false;
        return (
          <li key={l.step} style={{ gridTemplateColumns: "72px 1fr" }} className={isChanged ? "diff-added" : undefined}>
            <span className={`flag ${l.flag}`}>{FLAG_WORD[l.flag]}</span>
            <span>
              <strong>{l.subject}</strong> — {l.action}. {l.outcome}
              {isChanged && <> <span className="badge neutral">Changed</span></>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function CriteriaList({ criteria }: { criteria: Criterion[] }) {
  return (
    <ul className="criteria" aria-label="Criteria">
      {criteria.map((c) => (
        <li key={c.id}>
          <span className={`mark ${c.status}`} aria-hidden="true">{MARK[c.status]}</span>
          <span>
            <span className="visually-hidden">{STATUS_WORD[c.status]}: </span>{c.label}{c.critical && <span className="small muted"> (required)</span>}
            {c.note && <span className="small muted" style={{ display: "block" }}>{c.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ControlField({ control: c, value, onChange, disabled }: { control: PracticeControl; value: unknown; onChange: (v: unknown) => void; disabled: boolean }) {
  if (c.type === "toggle") {
    return (
      <label className="checkbox">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
        <span><span className="field-label" style={{ marginBottom: 2 }}>{c.label}</span>{c.help && <span className="small muted">{c.help}</span>}</span>
      </label>
    );
  }
  if (c.type === "multiselect") {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    return (
      <fieldset style={{ border: 0, padding: 0, margin: "0 0 16px" }}>
        <legend className="field-label">{c.label}</legend>
        {c.help && <p className="help small muted">{c.help}</p>}
        {(c.options ?? []).map((o) => (
          <label key={o.value} className="checkbox" style={{ padding: "6px 0" }}>
            <input type="checkbox" checked={arr.includes(o.value)} disabled={disabled} onChange={(e) => onChange(e.target.checked ? [...arr, o.value] : arr.filter((x) => x !== o.value))} />
            <span>{o.label}</span>
          </label>
        ))}
      </fieldset>
    );
  }
  if (c.type === "select") {
    return (
      <label className="field">
        <span>{c.label}</span>
        {c.help && <span className="help">{c.help}</span>}
        <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
          {(c.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
    );
  }
  if (c.type === "number") {
    return (
      <label className="field">
        <span>{c.label}</span>
        {c.help && <span className="help">{c.help}</span>}
        <input type="number" inputMode="decimal" step="any" value={value === undefined || value === null || Number.isNaN(value) ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} disabled={disabled} />
      </label>
    );
  }
  return (
    <label className="field">
      <span>{c.label}</span>
      {c.help && <span className="help">{c.help}</span>}
      <input type="text" value={String(value ?? "")} maxLength={500} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </label>
  );
}

type Invoice = { id: string; supplier: string; amount: number; newSupplier: boolean; matchConfidence: number; note: string };
type Passage = { id: string; title: string; text: string };

function ScenarioData({ kind, data }: { kind: string; data: Record<string, unknown> }) {
  if (kind === "approval_boundary" && Array.isArray(data.invoices)) {
    const invoices = data.invoices as Invoice[];
    return (
      <div style={{ marginTop: 12 }}>
        <h3 style={{ fontSize: 16, lineHeight: "24px" }}>Today&rsquo;s invoices (fictional)</h3>
        <div className="scroll-x" role="region" aria-label="Invoices in this scenario" tabIndex={0}>
          <table>
            <thead><tr><th scope="col">Invoice</th><th scope="col">Supplier</th><th scope="col">Amount</th><th scope="col">Supplier status</th><th scope="col">Match confidence</th><th scope="col">Note</th></tr></thead>
            <tbody>
              {invoices.map((i) => <tr key={i.id}><th scope="row">{i.id}</th><td>{i.supplier}</td><td>{i.amount.toLocaleString()}</td><td>{i.newSupplier ? "New" : "Known"}</td><td>{i.matchConfidence}</td><td>{i.note}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  if (kind === "retrieval_explorer" && Array.isArray(data.passages)) {
    const passages = data.passages as Passage[];
    return (
      <div style={{ marginTop: 12 }}>
        <h3 style={{ fontSize: 16, lineHeight: "24px" }}>The question</h3>
        <p className="source">{String(data.question ?? "")}</p>
        <h3 style={{ fontSize: 16, lineHeight: "24px", marginTop: 12 }}>Passages in the corpus (fictional)</h3>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }} className="stack-sm">
          {passages.map((p) => <li key={p.id} className="source"><span className="label">{p.id} · {p.title}</span>{p.text}</li>)}
        </ul>
      </div>
    );
  }
  return null;
}
