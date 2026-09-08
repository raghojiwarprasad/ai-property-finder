"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

export type PreferencesValue = {
  sessionMinutes: 10 | 20 | 40;
  personalExamples: boolean;
  exampleDomainOverride: string | null;
  reminders: boolean;
};

const DOMAIN_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "No override (use my experience)" },
  { value: "general", label: "General examples" },
  { value: "supplier_comparison", label: "Comparing suppliers and quotes" },
  { value: "operations", label: "Operations and processes" },
  { value: "leadership", label: "Leading a team" },
  { value: "marketing", label: "Marketing" },
  { value: "software", label: "Software" },
  { value: "research", label: "Research" },
  { value: "community", label: "Community and volunteering" },
];

/**
 * Preferences save on change (PRD-10 F02, F07): personal examples can be disabled entirely,
 * a different example domain can be chosen, session length is editable, reminders are opt-in.
 */
export function PreferencesForm({ preferences }: { preferences: PreferencesValue }) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<PreferencesValue>(preferences);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function patch(change: Partial<PreferencesValue>, label: string): void {
    const previous = prefs;
    setPrefs({ ...prefs, ...change });
    setError(null);
    setStatus(null);
    start(async () => {
      try {
        const r = await api<{ preferences: PreferencesValue }>("/api/profile/preferences", { method: "PATCH", body: change });
        setPrefs(r.preferences);
        setStatus(`${label} saved.`);
        router.refresh();
      } catch (e) {
        setPrefs(previous);
        setError(e instanceof ApiError ? e.message : "Could not save that preference. Try again.");
      }
    });
  }

  return (
    <div className="stack">
      <label className="checkbox">
        <input type="checkbox" checked={prefs.personalExamples} disabled={pending} onChange={(e) => patch({ personalExamples: e.target.checked }, "Personal examples")} />
        <span>
          <span className="field-label" style={{ marginBottom: 2 }}>Use my experience in examples</span>
          <span className="small muted">When off, lessons use general or clearly hypothetical scenarios. Everything else works the same.</span>
        </span>
      </label>

      <label className="field">
        <span>Example domain</span>
        <span className="help">Choose a different setting for examples without changing your stored facts.</span>
        <select value={prefs.exampleDomainOverride ?? ""} disabled={pending} onChange={(e) => patch({ exampleDomainOverride: e.target.value === "" ? null : e.target.value }, "Example domain")}>
          {DOMAIN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>

      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="field-label">Session length</legend>
        <p className="help small muted" style={{ marginBottom: 6 }}>How long a typical session should be. You can change it from Today at any time.</p>
        <div className="row" role="group" aria-label="Session length in minutes">
          {([10, 20, 40] as const).map((m) => (
            <label key={m} className="radio" style={{ padding: "6px 0" }}>
              <input type="radio" name="sessionMinutes" value={m} checked={prefs.sessionMinutes === m} disabled={pending} onChange={() => patch({ sessionMinutes: m }, "Session length")} />
              <span>{m} minutes</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="checkbox">
        <input type="checkbox" checked={prefs.reminders} disabled={pending} onChange={(e) => patch({ reminders: e.target.checked }, "Reminders")} />
        <span>
          <span className="field-label" style={{ marginBottom: 2 }}>Send me learning reminders</span>
          <span className="small muted">Optional and off by default. Reminders are separate from essential messages about your account, which you always receive.</span>
        </span>
      </label>

      <p className="status-line" role="status" aria-live="polite">{pending ? "Saving…" : status ?? ""}</p>
      {error && <p className="alert error" role="alert">{error}</p>}
    </div>
  );
}
