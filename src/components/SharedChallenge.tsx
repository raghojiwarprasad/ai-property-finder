"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

type Option = { id: string; text: string };
type Outcome = { result: "pass" | "fail"; feedback: string; nextMove: string };

/** Recipient challenge: one selected-response question, feedback without an account, then an optional invitation. */
export function SharedChallenge({ token, question, options }: { token: string; question: string; options: Option[] }) {
  const [optionId, setOptionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!optionId) return;
    setBusy(true);
    setError(null);
    try {
      setOutcome(await api<Outcome>(`/api/shares/public/${encodeURIComponent(token)}/attempt`, { method: "POST", body: { optionId } }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not check your answer. Your choice is kept; try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card" onSubmit={submit} aria-labelledby="challenge-question">
      <fieldset style={{ border: 0, padding: 0, margin: 0 }} disabled={busy || outcome !== null}>
        <legend id="challenge-question" className="field-label" style={{ fontSize: 18, marginBottom: 12 }}>{question}</legend>
        {options.map((o) => (
          <label key={o.id} className="option">
            <input type="radio" name="option" value={o.id} checked={optionId === o.id} onChange={() => setOptionId(o.id)} />
            <span>{o.text}</span>
          </label>
        ))}
      </fieldset>

      {error && <p className="alert error" role="alert">{error}</p>}

      {!outcome ? (
        <div className="row" style={{ marginTop: 12 }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={busy || !optionId}>{busy ? "Checking…" : "Check my answer"}</button>
        </div>
      ) : (
        <div className="stack" style={{ marginTop: 16 }}>
          <div className={`alert ${outcome.result === "pass" ? "success" : "caution"}`} role="status">
            <p><strong>{outcome.result === "pass" ? "That is the stronger answer." : "Not quite, and the reason matters."}</strong></p>
            <p>{outcome.feedback}</p>
            {outcome.nextMove && <p className="small">{outcome.nextMove}</p>}
          </div>
          <div className="row">
            <Link className="btn btn-primary" href="/start/experience">Explain this using my experience</Link>
            <Link className="btn btn-secondary" href="/">Start my own path</Link>
          </div>
        </div>
      )}
    </form>
  );
}
