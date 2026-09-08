"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { PublicItem } from "@/content/types";

type Result = { result: string; summary: string; mainGap: string | null; nextMove: string; criteria: Array<{ id: string; label: string; critical: boolean; status: string }> };

export function SampleTask({ item }: { item: PublicItem }) {
  const [optionId, setOptionId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const submission = item.prompt.kind === "selected" ? { optionId } : { text };
      setResult(await api<Result>("/api/sample/grade", { body: { family: item.family, submission } }));
    } catch (e) { setError(e instanceof ApiError ? e.message : "Could not check the answer."); }
    finally { setBusy(false); }
  };
  return (
    <section className="card" aria-labelledby="sample-task">
      <h2 id="sample-task" style={{ fontSize: 20, lineHeight: "28px" }}>{item.title}</h2>
      {item.supplied.map((s) => <div key={s.label} className="source" style={{ marginBottom: 8 }}><span className="label">{s.label}</span>{s.text}</div>)}
      <p className="prose" style={{ marginTop: 12 }}>{item.prompt.question}</p>
      {item.prompt.kind === "selected" ? (
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="visually-hidden">Options</legend>
          {item.prompt.options.map((o) => (
            <label key={o.id} className="option"><input type="radio" name="sample" value={o.id} checked={optionId === o.id} onChange={() => setOptionId(o.id)} disabled={Boolean(result)} /><span>{o.text}</span></label>
          ))}
          {item.prompt.allowUnsure && <label className="option"><input type="radio" name="sample" value="unsure" checked={optionId === "unsure"} onChange={() => setOptionId("unsure")} disabled={Boolean(result)} /><span>I&apos;m not sure</span></label>}
        </fieldset>
      ) : (
        <label className="field"><span>Your answer</span><textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} disabled={Boolean(result)} /></label>
      )}
      {!result && <button className="btn btn-primary" onClick={submit} disabled={busy || (item.prompt.kind === "selected" ? !optionId : text.trim().length < 10)}>Check my answer</button>}
      {error && <p className="alert error" role="alert">{error}</p>}
      {result && (
        <div className={`alert ${result.result === "pass" ? "success" : result.result === "provisional" ? "caution" : "info"}`} role="status" style={{ marginTop: 12 }}>
          <p><strong>{result.summary}</strong></p>
          {result.mainGap && <p>{result.mainGap}</p>}
          <p className="small">{result.nextMove}</p>
          <ul className="criteria">{result.criteria.map((c) => <li key={c.id}><span className={`mark ${c.status}`} aria-hidden="true">{c.status === "met" ? "✓" : c.status === "uncertain" ? "?" : "✗"}</span><span><span className="visually-hidden">{c.status === "met" ? "Met: " : c.status === "uncertain" ? "Uncertain: " : "Not met: "}</span>{c.label}{c.critical ? " (critical)" : ""}</span></li>)}</ul>
          <p className="small muted" style={{ marginTop: 8 }}>Sample feedback from the reviewed deterministic checker; nothing was saved.</p>
          <button className="btn btn-ghost" onClick={() => { setResult(null); setOptionId(null); }}>Try again</button>
        </div>
      )}
    </section>
  );
}
