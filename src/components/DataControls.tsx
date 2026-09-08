"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, local } from "@/lib/api";

export type ShareRow = { id: string; kind: string; title: string; publishedAt: string; revokedAt: string | null; flaggedForReview: boolean };

/**
 * "Your data" (PRD-10 F04, F05): export as a file, revoke shares, delete the account after a
 * two-step confirmation that states scope and timeline before the irreversible action.
 */
export function DataControls({ shares: initialShares, accountKind }: { shares: ShareRow[]; accountKind: "guest" | "account" }) {
  const router = useRouter();
  const [shares, setShares] = useState(initialShares);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function exportData(): void {
    setExportError(null);
    setExportStatus("Preparing your export…");
    start(async () => {
      try {
        const res = await fetch("/api/exports", { method: "POST", credentials: "same-origin", cache: "no-store" });
        if (!res.ok) {
          let message = `Export failed (${res.status}).`;
          try { message = (await res.json()).error?.message ?? message; } catch { /* keep default */ }
          throw new ApiError("export_failed", message, res.status);
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "learn-ai-export.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
        setExportStatus("Your export has been downloaded as learn-ai-export.json. It contains your experience context, goals, work and learning evidence in a documented JSON structure with readable summaries.");
      } catch (e) {
        setExportStatus(null);
        setExportError(e instanceof ApiError ? e.message : "Could not prepare the export. Try again in a moment.");
      }
    });
  }

  function revoke(id: string): void {
    setShareError(null);
    setShareStatus(null);
    start(async () => {
      try {
        await api(`/api/shares/${id}`, { method: "DELETE" });
        setShares((s) => s.map((x) => (x.id === id ? { ...x, revokedAt: new Date().toISOString() } : x)));
        setShareStatus("Link revoked. Anyone opening it now sees an unavailable page.");
      } catch (e) {
        setShareError(e instanceof ApiError ? e.message : "Could not revoke that link. Try again.");
      }
    });
  }

  function deleteAccount(): void {
    setDeleteError(null);
    start(async () => {
      try {
        await api("/api/account", { method: "DELETE" });
        local.clearPrivate();
        router.push("/");
      } catch (e) {
        setDeleteError(e instanceof ApiError ? e.message : "Could not delete the account. Nothing has been removed; try again.");
      }
    });
  }

  const active = shares.filter((s) => !s.revokedAt);
  const revoked = shares.filter((s) => s.revokedAt);

  return (
    <div className="stack">
      <div className="card compact stack-sm">
        <h3>Export your records</h3>
        <p className="small muted">A JSON file with your experience facts, goals, work, evaluations and learning evidence, plus readable summaries. It never includes other people&rsquo;s data or internal secrets.</p>
        <div className="row">
          <button type="button" className="btn btn-secondary" onClick={exportData} disabled={pending}>Download my data</button>
        </div>
        {exportStatus && <p className="status-line" role="status">{exportStatus}</p>}
        {exportError && <p className="alert error" role="alert">{exportError}</p>}
      </div>

      <div className="card compact stack-sm">
        <h3>Shared links</h3>
        {shares.length === 0 ? (
          <p className="small muted">You have not shared anything. Sharing always starts from a preview of exactly what will be public.</p>
        ) : (
          <>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }} aria-label="Active shared links">
              {active.map((s) => (
                <li key={s.id} className="fact-row">
                  <div className="value">
                    <div className="row small muted" style={{ gap: 8 }}>
                      <span className="badge neutral">{s.kind === "challenge" ? "Challenge" : "Work"}</span>
                      <span>Shared {new Date(s.publishedAt).toLocaleDateString()}</span>
                      {s.flaggedForReview && <span className="badge caution">Contains a fact you changed</span>}
                    </div>
                    <p style={{ margin: "4px 0 0" }}>{s.title || "Untitled share"}</p>
                  </div>
                  <button type="button" className="btn btn-danger" onClick={() => revoke(s.id)} disabled={pending}>Revoke</button>
                </li>
              ))}
              {active.length === 0 && <li className="small muted">No active links.</li>}
            </ul>
            {revoked.length > 0 && (
              <details>
                <summary>Revoked links ({revoked.length})</summary>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {revoked.map((s) => <li key={s.id} className="fact-row small muted"><span className="value">{s.title || "Untitled share"} — revoked {new Date(s.revokedAt!).toLocaleDateString()}</span></li>)}
                </ul>
              </details>
            )}
          </>
        )}
        {shareStatus && <p className="status-line" role="status">{shareStatus}</p>}
        {shareError && <p className="alert error" role="alert">{shareError}</p>}
      </div>

      <div className="card compact stack-sm" aria-labelledby="delete-heading">
        <h3 id="delete-heading">Delete {accountKind === "account" ? "your account" : "this session"}</h3>
        <p className="small muted">
          {accountKind === "account"
            ? "Removes your account, experience facts, goals, work, practice runs, tutor conversations and shared links."
            : "Removes this guest session and everything in it: experience facts, goal, work, practice runs and shared links."}
        </p>
        {deleteStep === 0 && (
          <div className="row"><button type="button" className="btn btn-danger" onClick={() => setDeleteStep(1)} disabled={pending}>Delete {accountKind === "account" ? "my account" : "this session"}…</button></div>
        )}
        {deleteStep === 1 && (
          <div className="alert caution" role="group" aria-labelledby="delete-scope-heading">
            <h4 id="delete-scope-heading">What happens, and when</h4>
            <ul style={{ margin: "8px 0 12px", paddingLeft: 20 }}>
              <li>Access ends immediately, and every shared link stops working.</li>
              <li>Your content is removed now.</li>
              <li>Backups age out within 30 days.</li>
              <li>This cannot be undone. Download your data first if you want to keep it.</li>
            </ul>
            <div className="inline-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteStep(2)} disabled={pending}>I understand, continue</button>
              <button type="button" className="btn btn-ghost" onClick={() => setDeleteStep(0)} disabled={pending}>Cancel</button>
            </div>
          </div>
        )}
        {deleteStep === 2 && (
          <div className="alert error" role="group" aria-labelledby="delete-final-heading">
            <h4 id="delete-final-heading">Final confirmation</h4>
            <p className="small">Delete everything now? You will be taken back to the start page.</p>
            <div className="inline-actions">
              <button type="button" className="btn btn-danger" onClick={deleteAccount} disabled={pending}>{pending ? "Deleting…" : "Yes, delete permanently"}</button>
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteStep(0)} disabled={pending}>Keep my data</button>
            </div>
          </div>
        )}
        {deleteError && <p className="alert error" role="alert">{deleteError}</p>}
      </div>
    </div>
  );
}
