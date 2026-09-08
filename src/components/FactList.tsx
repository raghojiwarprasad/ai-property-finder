"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

/** Shape returned by listFacts / GET /api/account/me. */
export type FactRow = {
  id: string;
  factType: string;
  value: string;
  sourceType: string;
  confirmed: boolean;
};

type Notice = { tone: "success" | "caution" | "error" | "info"; text: string };

const SOURCE_LABEL: Record<string, string> = { cv: "CV", manual: "You wrote this", user_edit: "Edited by you" };
const TYPE_LABEL: Record<string, string> = {
  role: "Role", project: "Project", action: "Something you did", tool: "Tool", domain: "Area of work", education: "Education", outcome: "Outcome", constraint: "Constraint",
};

function sourceLabel(s: string): string { return SOURCE_LABEL[s] ?? "Recorded"; }
function typeLabel(t: string): string { return TYPE_LABEL[t] ?? t.replace(/_/g, " "); }

/**
 * "Experience I use for examples": every fact carries its source, and the learner can correct or
 * remove it. Changes carry a profile-version precondition so two tabs cannot overwrite each other.
 */
export function FactList({ facts: initialFacts, profileVersion: initialVersion }: { facts: FactRow[]; profileVersion: number }) {
  const router = useRouter();
  const [facts, setFacts] = useState<FactRow[]>(initialFacts);
  const [version, setVersion] = useState(initialVersion);
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [stale, setStale] = useState(false);
  const [pending, start] = useTransition();
  const [addText, setAddText] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  async function reload(): Promise<void> {
    const me = await api<{ identity: { profileVersion: number } | null; facts: FactRow[] }>("/api/account/me");
    setFacts(me.facts ?? []);
    if (me.identity) setVersion(me.identity.profileVersion);
    setStale(false);
    router.refresh();
  }

  function handleError(e: unknown): void {
    if (e instanceof ApiError && e.status === 400 && e.details && typeof e.details.profileVersion === "number") {
      setStale(true);
      setNotice({ tone: "caution", text: "Your profile changed in another tab. Reload to see the latest facts before editing." });
      return;
    }
    setNotice({ tone: "error", text: e instanceof ApiError ? e.message : "Could not save that change. Your text is still here; try again." });
  }

  function save(fact: FactRow, value: string): void {
    setNotice(null);
    start(async () => {
      try {
        await api(`/api/profile/facts/${fact.id}`, { method: "PATCH", body: { value, expectedProfileVersion: version, previousValue: fact.value } });
        setEditing(null);
        await reload();
        setNotice({ tone: "success", text: "Saved. Future examples will use the corrected fact." });
      } catch (e) {
        handleError(e);
      }
    });
  }

  function remove(fact: FactRow): void {
    setNotice(null);
    start(async () => {
      try {
        const r = await api<{ flaggedShares: number }>(`/api/profile/facts/${fact.id}`, { method: "PATCH", body: { remove: true, expectedProfileVersion: version, previousValue: fact.value } });
        setConfirming(null);
        await reload();
        const shareNote = r.flaggedShares > 0 ? ` ${r.flaggedShares} shared ${r.flaggedShares === 1 ? "copy" : "copies"} containing it ${r.flaggedShares === 1 ? "was" : "were"} flagged; you can revoke them from the shares list below.` : "";
        setNotice({ tone: "info", text: `Removed. Future examples will no longer use it. Work you have already completed is unaffected.${shareNote}` });
      } catch (e) {
        handleError(e);
      }
    });
  }

  function addFact(e: React.FormEvent): void {
    e.preventDefault();
    setNotice(null);
    start(async () => {
      try {
        await api("/api/experience", { body: { text: addText } });
        setAddText("");
        setAddOpen(false);
        await reload();
        setNotice({ tone: "success", text: "Added. This description replaces anything you wrote manually before; facts from your CV and your edits are kept." });
      } catch (err) {
        setNotice({ tone: "error", text: err instanceof ApiError ? err.message : "Could not add that. Your text is still here; try again." });
      }
    });
  }

  return (
    <div className="stack">
      {notice && (
        <p className={`alert ${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
          {notice.text}
          {stale && <> <button type="button" className="btn btn-ghost" onClick={() => reload().catch(() => setNotice({ tone: "error", text: "Could not reload. Refresh the page." }))}>Reload facts</button></>}
        </p>
      )}

      {facts.length === 0 ? (
        <p className="muted">No experience facts are stored. Examples use general scenarios until you add some. You can learn fully without them.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }} aria-label="Experience facts">
          {facts.map((f) => (
            <li key={f.id} className="fact-row">
              <div className="value">
                <div className="row small muted" style={{ gap: 8, marginBottom: 4 }}>
                  <span className="badge neutral">{sourceLabel(f.sourceType)}</span>
                  <span>{typeLabel(f.factType)}</span>
                </div>
                {editing?.id === f.id ? (
                  <form onSubmit={(e) => { e.preventDefault(); save(f, editing.value); }} className="stack-sm">
                    <label className="field" style={{ marginBottom: 8 }}>
                      <span className="visually-hidden">Corrected value</span>
                      <input type="text" value={editing.value} maxLength={160} onChange={(e) => setEditing({ id: f.id, value: e.target.value })} disabled={pending || stale} />
                    </label>
                    <div className="inline-actions">
                      <button type="submit" className="btn btn-primary" disabled={pending || stale || editing.value.trim().length < 2}>Save</button>
                      <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)} disabled={pending}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <p style={{ margin: 0 }}>{f.value}</p>
                )}
              </div>
              {editing?.id !== f.id && (
                <div className="inline-actions">
                  {confirming === f.id ? (
                    <div className="alert caution" role="group" aria-label={`Confirm removal of ${f.value}`}>
                      <p className="small" style={{ marginBottom: 8 }}>Remove this fact? Future examples stop using it. Completed work stays as it is.</p>
                      <div className="inline-actions">
                        <button type="button" className="btn btn-danger" onClick={() => remove(f)} disabled={pending || stale}>Confirm remove</button>
                        <button type="button" className="btn btn-secondary" onClick={() => setConfirming(null)} disabled={pending}>Keep it</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button type="button" className="btn btn-ghost" onClick={() => { setConfirming(null); setEditing({ id: f.id, value: f.value }); }} disabled={pending || stale}>Edit</button>
                      <button type="button" className="btn btn-ghost" onClick={() => { setEditing(null); setConfirming(f.id); }} disabled={pending || stale}>Remove</button>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div>
        {addOpen ? (
          <form onSubmit={addFact} className="card compact stack-sm" aria-labelledby="add-fact-heading">
            <h4 id="add-fact-heading">Add experience in your own words</h4>
            <p className="small muted">One task, project or tool you know well is enough. This replaces anything you wrote manually before; facts from your CV and your edits are kept.</p>
            <label className="field">
              <span>Description (at least 20 characters)</span>
              <textarea value={addText} onChange={(e) => setAddText(e.target.value)} maxLength={8000} disabled={pending} rows={3} />
            </label>
            <div className="inline-actions">
              <button type="submit" className="btn btn-primary" disabled={pending || addText.trim().length < 20}>Add</button>
              <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(false)} disabled={pending}>Cancel</button>
            </div>
          </form>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(true)}>Add a fact manually</button>
        )}
      </div>
    </div>
  );
}
