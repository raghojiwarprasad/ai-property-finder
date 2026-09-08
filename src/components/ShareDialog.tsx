"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";

type Preview = {
  kind: "challenge" | "work";
  title: string;
  publicPayload: Record<string, unknown>;
  excluded: string[];
  assisted: boolean;
};
type Published = { shareId: string; token: string; url: string };

type Field = { id: string; label: string };
type Supplied = { label: string; text: string };

/**
 * "Share a sanitised copy": a deliberate preview of exactly what would be public, then explicit publish,
 * a copyable link and revocation. Closing the dialog never re-prompts; only the button reopens it.
 */
export function ShareDialog({ artefactId }: { artefactId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showName, setShowName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<Published | null>(null);
  const [revoked, setRevoked] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const loadPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      setPreview(await api<Preview>("/api/shares/preview", { method: "POST", body: { kind: "work", artefactId } }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not prepare the preview.");
    } finally {
      setLoading(false);
    }
  };

  const openDialog = () => {
    setOpen(true);
    setCopied(null);
    if (!preview && !published) void loadPreview();
  };

  const publish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const r = await api<Published>("/api/shares", { method: "POST", body: { kind: "work", artefactId, showName, displayName: showName ? displayName.trim() : undefined } });
      setPublished(r);
      setRevoked(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not publish. Nothing was made public; try again.");
    } finally {
      setPublishing(false);
    }
  };

  const revoke = async () => {
    if (!published) return;
    setPublishing(true);
    setError(null);
    try {
      await api(`/api/shares/${published.shareId}`, { method: "DELETE" });
      setRevoked(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not revoke the link. Try again.");
    } finally {
      setPublishing(false);
    }
  };

  // `published` is only ever set after a client action, so window is defined whenever this is non-empty.
  const fullUrl = published ? `${typeof window !== "undefined" ? window.location.origin : ""}${published.url}` : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied("Link copied.");
    } catch {
      setCopied("Copy is not available here. Select the link and copy it yourself.");
    }
  };

  const p = preview?.publicPayload ?? {};
  const fields = (p.fields as Field[] | null) ?? null;
  const content = (p.content as Record<string, string>) ?? {};
  const supplied = (p.supplied as Supplied[]) ?? [];

  return (
    <>
      <button type="button" className="btn btn-secondary" onClick={openDialog}>Share a sanitised copy</button>
      <dialog
        ref={dialogRef}
        aria-labelledby="share-heading"
        onClose={() => setOpen(false)}
        onCancel={(e) => { e.preventDefault(); setOpen(false); }}
        style={{ border: 0, padding: 0, background: "transparent", maxWidth: 640, width: "calc(100% - 32px)", maxHeight: "90vh" }}
      >
        <div className="card" style={{ maxHeight: "90vh", overflow: "auto" }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <h2 id="share-heading" style={{ fontSize: 20, lineHeight: "28px" }}>{published ? "Your shared copy" : "What would be public"}</h2>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
          </div>

          {loading && <p className="status-line" role="status">Preparing a sanitised copy…</p>}
          {error && <p className="alert error" role="alert">{error}</p>}
          {error && !preview && !loading && <button type="button" className="btn btn-secondary" onClick={loadPreview}>Try again</button>}

          {preview && !published && (
            <div className="stack" style={{ marginTop: 12 }}>
              <p className="muted small">This is exactly what a recipient sees. Employer names, CV facts, private scores and tutor conversations are removed. Nothing is published until you choose Publish.</p>
              <section className="card compact muted-surface" aria-label="Public preview">
                <h3 style={{ fontSize: 16, lineHeight: "24px" }}>{String(p.title ?? preview.title)}</h3>
                {p.capabilityTitle ? <p className="muted small">Capability: {String(p.capabilityTitle)}</p> : null}
                {p.taskContext ? <p><strong>Task:</strong> {String(p.taskContext)}</p> : null}
                {supplied.length > 0 && (
                  <div className="stack-sm">
                    {supplied.map((s) => <blockquote key={s.label} className="source" style={{ margin: 0, fontSize: 16 }}><span className="label">{s.label}</span>{s.text}</blockquote>)}
                  </div>
                )}
                {fields ? (
                  <div className="stack-sm" style={{ marginTop: 12 }}>
                    {fields.map((f) => (
                      <div key={f.id}>
                        <span className="field-label" style={{ marginBottom: 2 }}>{f.label}</span>
                        <span style={{ whiteSpace: "pre-wrap" }}>{content[f.id] || <span className="muted">(empty)</span>}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="stack-sm" style={{ marginTop: 12 }}>
                    {Object.entries(content).map(([k, v]) => <p key={k} style={{ whiteSpace: "pre-wrap" }}>{v}</p>)}
                  </div>
                )}
                <div className="row" style={{ marginTop: 12 }}>
                  <span className="badge neutral">{preview.assisted ? "Worked answer used" : "Independent work"}</span>
                </div>
                {p.assessmentScope ? <p className="muted small" style={{ marginTop: 8 }}>{String(p.assessmentScope)}</p> : null}
              </section>

              <div>
                <h3 style={{ fontSize: 16, lineHeight: "24px" }}>Not included</h3>
                <ul className="trace">
                  {preview.excluded.map((x) => <li key={x} style={{ gridTemplateColumns: "1fr" }}><span>{x}</span></li>)}
                </ul>
              </div>

              <label className="checkbox">
                <input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} />
                <span>Show my name<span className="muted small" style={{ display: "block" }}>Off by default. Your profile is never made discoverable.</span></span>
              </label>
              {showName && (
                <label className="field">
                  <span>Display name</span>
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} placeholder="How you want to be named" />
                </label>
              )}

              <div className="inline-actions">
                <button type="button" className="btn btn-primary" disabled={publishing || (showName && displayName.trim().length === 0)} onClick={publish}>{publishing ? "Publishing…" : "Publish"}</button>
                <button type="button" className="btn btn-ghost" disabled={publishing} onClick={() => setOpen(false)}>Not now</button>
              </div>
            </div>
          )}

          {published && (
            <div className="stack" style={{ marginTop: 12 }}>
              {revoked ? (
                <p className="alert success" role="status">This link has been revoked. Anyone who opens it now sees a neutral “not available” page with no details about you.</p>
              ) : (
                <>
                  <p className="alert success" role="status">Published. Anyone with this link can see the sanitised copy; nobody can find it without the link.</p>
                  <label className="field">
                    <span>Share link</span>
                    <input type="text" readOnly value={fullUrl} onFocus={(e) => e.currentTarget.select()} />
                  </label>
                  {copied && <p className="status-line" role="status">{copied}</p>}
                </>
              )}
              <div className="inline-actions">
                {!revoked && <button type="button" className="btn btn-primary" onClick={copy}>Copy link</button>}
                {!revoked && <a className="btn btn-secondary" href={published.url} target="_blank" rel="noopener">Open in a new tab</a>}
                {!revoked && <button type="button" className="btn btn-danger" disabled={publishing} onClick={revoke}>{publishing ? "Revoking…" : "Revoke"}</button>}
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
              </div>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
