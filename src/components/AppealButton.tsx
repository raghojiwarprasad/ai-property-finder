"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

type AppealResult = { appealId: string; status: string; note: string };

/** "Challenge this grade": asks for a short reason, records an appeal, keeps the original grade visible as provisional. */
export function AppealButton({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<AppealResult | null>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await api<AppealResult>(`/api/attempts/${attemptId}/appeal`, { method: "POST", body: { reason } });
      setDone(r);
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not record your challenge. Your reason is kept; try again.");
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setOpen(false);
    openerRef.current?.focus();
  };

  if (done) {
    return <p className="alert success" role="status" style={{ flexBasis: "100%" }}>{done.note}</p>;
  }

  return (
    <>
      <button ref={openerRef} type="button" className="btn btn-secondary" aria-expanded={open} aria-controls={formId} onClick={() => setOpen((o) => !o)}>
        Challenge this grade
      </button>
      {open && (
        <form id={formId} className="card compact" onSubmit={submit} style={{ flexBasis: "100%" }} aria-label="Challenge this grade">
          <label className="field">
            <span>What do you think was marked incorrectly?</span>
            <span className="help">The original grade stays on record and is shown as provisional while someone reviews it.</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} required minLength={5} maxLength={2000} autoFocus />
          </label>
          {error && <p className="alert error" role="alert">{error}</p>}
          <div className="inline-actions">
            <button type="submit" className="btn btn-primary" disabled={busy || reason.trim().length < 5}>{busy ? "Recording…" : "Send my challenge"}</button>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={close}>Cancel</button>
          </div>
        </form>
      )}
    </>
  );
}
