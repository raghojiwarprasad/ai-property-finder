"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

type UploadStatus = {
  id: string; status: string; stages: Array<{ stage: string; at: string }>; errorClass: string | null; errorMessage: string | null; recovery: string[];
  facts?: Array<{ id: string; factType: string; value: string }>; extractionMode?: "fixture" | "live"; ambiguities?: string[]; injectionDetected?: boolean;
};

const STAGE_LABELS: Record<string, string> = {
  validating: "Checking the file",
  reading: "Reading your document",
  picking_experience: "Picking out useful experience",
  preparing_starting_point: "Preparing your starting point",
  instructions_ignored: "Some text in the document looked like instructions and was ignored",
};

const ACCEPT = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

export function ExperienceInput({ existingFactCount }: { existingFactCount: number }) {
  const router = useRouter();
  const [mode, setMode] = useState<"upload" | "manual">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [manualResult, setManualResult] = useState<{ facts: Array<{ id: string; value: string; factType: string }>; ambiguities: string[] } | null>(null);
  const [slow, setSlow] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const pick = (f: File | null) => {
    setError(null);
    setStatus(null);
    if (!f) { setFile(null); return; }
    if (f.size > 10 * 1024 * 1024) { setError("That file is larger than 10 MB. Choose a smaller file or paste a short description instead."); setFile(null); return; }
    setFile(f);
  };

  const upload = async () => {
    if (!file) return;
    setBusy(true); setError(null); setSlow(false); setElapsed(0);
    const controller = new AbortController();
    abortRef.current = controller;
    const started = Date.now();
    const tick = () => { setElapsed(Math.round((Date.now() - started) / 1000)); if (Date.now() - started > 20_000) setSlow(true); timerRef.current = setTimeout(tick, 1000); };
    tick();
    try {
      const form = new FormData();
      form.append("file", file);
      const s = await api<UploadStatus>("/api/uploads", { form, signal: controller.signal });
      setStatus(s);
      if (s.status === "failed") setError(s.errorMessage ?? "The document could not be read.");
    } catch (e) {
      if (e instanceof ApiError && e.code === "cancelled") setStatus({ id: "", status: "cancelled", stages: [], errorClass: null, errorMessage: null, recovery: ["Paste a short description instead", "Upload again"] });
      else setError(e instanceof ApiError ? e.message : "Upload failed. Your file is still selected; try again or paste a description.");
    } finally {
      if (timerRef.current) clearTimeout(timerRef.current);
      setBusy(false);
      abortRef.current = null;
    }
  };

  const cancel = () => { abortRef.current?.abort(); };

  const submitManual = async () => {
    setBusy(true); setError(null);
    try {
      const r = await api<{ facts: Array<{ id: string; value: string; factType: string }>; ambiguities: string[] }>("/api/experience", { body: { text: manual } });
      setManualResult(r);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save your description. It is still in the box; try again.");
    } finally { setBusy(false); }
  };

  const skip = async () => {
    setBusy(true); setError(null);
    try { await api("/api/experience/skip", { body: {} }); router.push("/start/goal"); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Could not continue."); setBusy(false); }
  };

  const done = (status?.status === "ready") || Boolean(manualResult);
  const facts = manualResult?.facts ?? status?.facts ?? [];
  const ambiguities = manualResult?.ambiguities ?? status?.ambiguities ?? [];

  return (
    <div className="stack" style={{ marginTop: 24 }}>
      {existingFactCount > 0 && !done && (
        <p className="alert info" role="status">You already have {existingFactCount} saved context fact{existingFactCount === 1 ? "" : "s"}. Adding more replaces facts from the same source; or <a href="/start/goal">continue to your goal</a>.</p>
      )}
      <div className="row" role="group" aria-label="How to bring your experience">
        <button className="chip" aria-pressed={mode === "upload"} onClick={() => setMode("upload")}>Upload a CV</button>
        <button className="chip" aria-pressed={mode === "manual"} onClick={() => setMode("manual")}>Tell us instead</button>
      </div>

      {mode === "upload" && !done && (
        <div className="stack">
          <div
            className={`dropzone${drag ? " active" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0] ?? null); }}
          >
            <label className="field" style={{ marginBottom: 8 }}>
              <span>Choose your CV</span>
              <span className="help">PDF, DOCX or TXT, up to 10 MB and 50 pages.</span>
              <input type="file" accept={ACCEPT} onChange={(e) => pick(e.target.files?.[0] ?? null)} disabled={busy} />
            </label>
            {file && (
              <p className="small row" style={{ justifyContent: "center" }}>
                <span>{file.name} · {(file.size / 1024).toFixed(0)} KB</span>
                {!busy && <button className="btn btn-ghost" onClick={() => pick(null)}>Remove</button>}
              </p>
            )}
          </div>
          <p className="small muted">Your CV is used only to personalise learning. You can edit or remove every extracted fact. Contact details are not used for teaching. The raw file and its full text are deleted within 24 hours; guest sessions expire after 7 days unless you save your progress. See the exact policy on the Your profile page.</p>
          {!busy && !status && <button className="btn btn-primary btn-lg" onClick={upload} disabled={!file}>Use this CV</button>}
          {busy && (
            <div className="card compact" role="status" aria-live="polite">
              <ul className="progress-stages">
                {["validating", "reading", "picking_experience", "preparing_starting_point"].map((s, i) => (
                  <li key={s} className={i === 0 || elapsed > i * 2 ? (elapsed > (i + 1) * 2 ? "done" : "current") : ""}><span className="dot" aria-hidden="true" />{STAGE_LABELS[s]}</li>
                ))}
              </ul>
              <div className="row">
                <button className="btn btn-secondary" onClick={cancel}>Cancel</button>
                <span className="small muted">{elapsed}s</span>
              </div>
              {slow && <p className="alert caution" style={{ marginTop: 12 }}>This is taking longer than usual. You can keep waiting, or <button className="btn btn-ghost" onClick={() => { cancel(); setMode("manual"); }}>continue with a short description</button> instead.</p>}
            </div>
          )}
          {status?.status === "cancelled" && (
            <div className="alert info" role="status">
              <p>Upload cancelled. Nothing was saved.</p>
              <div className="inline-actions"><button className="btn btn-secondary" onClick={() => setMode("manual")}>Paste a short description instead</button><button className="btn btn-secondary" onClick={() => setStatus(null)}>Upload again</button></div>
            </div>
          )}
        </div>
      )}

      {mode === "manual" && !done && (
        <div className="stack">
          <label className="field">
            <span>What have you studied or worked on?</span>
            <span className="help">Mention one task or project you know well, for example “I coordinate suppliers and compare their quotes” or “I help organise a community event and use spreadsheets”. 20 to 8,000 characters.</span>
            <textarea value={manual} onChange={(e) => setManual(e.target.value)} rows={6} maxLength={8000} disabled={busy} />
          </label>
          <div className="row">
            <button className="btn btn-primary btn-lg" onClick={submitManual} disabled={busy || manual.trim().length < 20}>Use this description</button>
            <span className="small muted">{manual.trim().length} characters</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert error" role="alert">
          <p>{error}</p>
          {status?.recovery?.length ? <div className="inline-actions">{status.recovery.map((r) => <button key={r} className="btn btn-secondary" onClick={() => { setError(null); setStatus(null); if (r.startsWith("Paste")) setMode("manual"); }}>{r}</button>)}</div> : null}
        </div>
      )}

      {done && (
        <section className="card" aria-labelledby="context-heading" role="status">
          <h2 id="context-heading" style={{ fontSize: 20, lineHeight: "28px" }}>Here is what we will use for examples</h2>
          {status?.extractionMode && <p className="small muted">{status.extractionMode === "fixture" ? "Development fixture: facts were picked out by a reviewed deterministic extractor, not a live model." : "Facts were extracted by the model and checked against your document."}</p>}
          {status?.injectionDetected && <p className="alert caution">Some text in the document read like instructions to an AI system. It was treated as ordinary text and did not change anything.</p>}
          {facts.length === 0 ? (
            <p className="muted">We did not find a specific activity to build examples on. That is fine: your first lesson will use a general example, and you can add context later from Your profile.</p>
          ) : (
            <ul className="stack-sm" style={{ paddingLeft: 20 }}>
              {facts.slice(0, 5).map((f) => <li key={f.id}><span className="badge neutral" style={{ marginRight: 8 }}>{f.factType}</span>{f.value}</li>)}
            </ul>
          )}
          {ambiguities.map((a) => <p key={a} className="small muted" style={{ marginTop: 8 }}>{a}</p>)}
          <p className="small muted" style={{ marginTop: 12 }}>You can correct any of these on the next screen or in Your profile. No skill is inferred from them.</p>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn btn-primary btn-lg" onClick={() => router.push("/start/goal")}>Choose what to do with AI</button>
            <button className="btn btn-ghost" onClick={() => { setStatus(null); setManualResult(null); }}>Change my context</button>
          </div>
        </section>
      )}

      {!done && (
        <p className="small muted">Prefer not to share personal context? <button className="btn btn-ghost" onClick={skip} disabled={busy}>Start with general examples</button> You can still choose any goal, including research.</p>
      )}
    </div>
  );
}
