"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError, newKey } from "@/lib/api";

export type TutorMessage = { id: string; role: "learner" | "tutor"; content: string; status: string; assistanceLevel: string | null; providerMode: string | null; createdAt: string; reported: boolean };

export function TutorPanel({ assignmentId, initial, selection, blockId, onClose, onAssistance, isAssessedWork }: {
  assignmentId: string; initial: TutorMessage[]; selection: string | null; blockId: string | null; onClose: () => void; onAssistance: () => void; isAssessedWork: boolean;
}) {
  const [messages, setMessages] = useState<TutorMessage[]>(initial);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); }, [messages.length]);

  const send = async (q: string, key: string, explicit = false) => {
    setBusy(true); setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const r = await api<{ learner: TutorMessage; tutor: TutorMessage }>("/api/tutor/messages", { body: { assignmentId, question: q, selection, blockId, requestKey: key, explicitSolutionRequest: explicit }, signal: controller.signal });
      setMessages((m) => [...m.filter((x) => x.id !== r.learner.id && x.id !== r.tutor.id), r.learner, r.tutor]);
      setPendingKey(null); setPendingQuestion(null); setQuestion("");
      if (r.tutor.assistanceLevel && r.tutor.assistanceLevel !== "none") onAssistance();
    } catch (e) {
      if (e instanceof ApiError && e.code === "cancelled") setError("Stopped. Your question is kept; send it again when ready.");
      else setError(e instanceof ApiError ? e.message : "The tutor could not respond. Your question is kept; try again.");
    } finally { setBusy(false); abortRef.current = null; }
  };

  const submit = (explicit = false) => {
    const q = (pendingQuestion ?? question).trim();
    if (!q) return;
    const key = pendingKey ?? newKey();
    setPendingKey(key); setPendingQuestion(q);
    void send(q, key, explicit);
  };

  const report = async (id: string) => {
    try { await api(`/api/tutor/messages/${id}/report`, { body: { description: "Reported from the tutor panel as incorrect or unhelpful." } }); setMessages((m) => m.map((x) => (x.id === id ? { ...x, reported: true } : x))); }
    catch { setError("Could not send the report."); }
  };

  return (
    <div className="tutor-sheet card" role="dialog" aria-label="Tutor" aria-modal="false" style={{ padding: 0, display: "flex", flexDirection: "column", maxHeight: "80vh" }}>
      <div className="row" style={{ justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
        <strong>Ask about this idea</strong>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
      {selection && <p className="small muted" style={{ padding: "8px 16px 0" }}>About: “{selection.slice(0, 140)}{selection.length > 140 ? "…" : ""}”</p>}
      <div className="tutor-messages" ref={listRef} aria-live="polite">
        {messages.length === 0 && <p className="small muted">The tutor explains the current block and can give a hint. It cannot mark your work or change your progress. {isAssessedWork ? "During a task it gives hints before a full answer; asking for the full answer marks your attempt as assisted." : ""}</p>}
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role}`}>
            {m.content}
            <span className="meta">
              {m.role === "tutor" && m.status === "incomplete" && "Incomplete response. "}
              {m.role === "tutor" && m.status === "failed" && "Failed. "}
              {m.role === "tutor" && m.assistanceLevel === "worked_solution" && "Worked solution: your next submission counts as assisted. "}
              {m.role === "tutor" && m.assistanceLevel === "hint" && "Hint. "}
              {m.role === "tutor" && m.providerMode === "fixture" && "Development fixture. "}
              {m.role === "tutor" && m.status === "complete" && (m.reported ? "Reported." : <button className="btn btn-ghost" style={{ minHeight: 28, padding: "0 6px", fontSize: 12 }} onClick={() => report(m.id)}>Report this response</button>)}
            </span>
          </div>
        ))}
        {busy && <div className="msg tutor" aria-busy="true">Thinking… <button className="btn btn-ghost" onClick={() => abortRef.current?.abort()}>Stop</button></div>}
      </div>
      {error && <p className="alert error small" role="alert" style={{ margin: "0 16px" }}>{error} {pendingQuestion && <button className="btn btn-ghost" onClick={() => submit()}>Retry</button>}</p>}
      <form style={{ padding: 16, borderTop: "1px solid var(--border)" }} onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <label className="field" style={{ marginBottom: 8 }}>
          <span className="visually-hidden">Your question</span>
          <textarea ref={inputRef} rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Why does this matter? Explain the second sentence…" disabled={busy} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} />
        </label>
        <div className="row">
          <button className="btn btn-primary" type="submit" disabled={busy || !question.trim()}>Ask</button>
          {isAssessedWork && <button className="btn btn-ghost" type="button" disabled={busy || !question.trim()} onClick={() => submit(true)}>Show the full answer (marks as assisted)</button>}
        </div>
      </form>
    </div>
  );
}
