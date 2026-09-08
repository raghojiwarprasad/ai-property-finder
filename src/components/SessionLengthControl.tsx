"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

/** "Make this shorter" / "Keep going": an editable session preference, never an inferred commitment. */
export function SessionLengthControl({ current }: { current: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const set = (m: 10 | 20 | 40) => {
    setError(null);
    start(async () => {
      try {
        await api("/api/profile/preferences", { method: "PATCH", body: { sessionMinutes: m } });
        router.refresh();
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Could not save your preference.");
      }
    });
  };
  return (
    <div className="row" role="group" aria-label="Session length">
      <span className="small muted">Session length: {current} minutes.</span>
      {current !== 10 && <button className="btn btn-ghost" disabled={pending} onClick={() => set(10)}>Make this shorter</button>}
      {current !== 40 && <button className="btn btn-ghost" disabled={pending} onClick={() => set(40)}>Keep going longer</button>}
      {current !== 20 && <button className="btn btn-ghost" disabled={pending} onClick={() => set(20)}>Back to 20 minutes</button>}
      {error && <span className="small" style={{ color: "var(--error)" }} role="alert">{error}</span>}
    </div>
  );
}
