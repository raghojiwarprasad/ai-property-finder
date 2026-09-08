"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

type Summary = { goal: string | null; attempts: number; artefacts: number };
type MergePreview = { guest: Summary; account: Summary };

/**
 * S10 account step (PRD-10 F01). Register claims the guest session atomically. Sign in never
 * merges silently: when both the guest session and the account have progress, the learner
 * chooses explicitly. Passwords stay in component state only and are never stored or logged.
 */
export function AccountForms({ initialTab = "register" }: { initialTab?: "register" | "signin" }) {
  const [tab, setTab] = useState<"register" | "signin">(initialTab);
  const ids = { register: useId(), signin: useId() };
  return (
    <div className="stack">
      <div role="group" aria-label="Account options" className="row" style={{ gap: 8 }}>
        <button type="button" id={`${ids.register}-tab`} aria-controls={`${ids.register}-panel`} className="chip" aria-pressed={tab === "register"} onClick={() => setTab("register")}>Save my progress</button>
        <button type="button" id={`${ids.signin}-tab`} aria-controls={`${ids.signin}-panel`} className="chip" aria-pressed={tab === "signin"} onClick={() => setTab("signin")}>Sign in</button>
      </div>
      <div id={`${ids.register}-panel`} aria-labelledby={`${ids.register}-tab`} hidden={tab !== "register"}>
        <RegisterForm />
      </div>
      <div id={`${ids.signin}-panel`} aria-labelledby={`${ids.signin}-tab`} hidden={tab !== "signin"}>
        <SignInForm />
      </div>
    </div>
  );
}

function fieldErrors(e: unknown): { message: string; field: "email" | "password" | null } {
  if (!(e instanceof ApiError)) return { message: "Something went wrong. Your details are still here; try again.", field: null };
  const m = e.message.toLowerCase();
  const field = m.includes("email") ? "email" : m.includes("password") ? "password" : null;
  return { message: e.message, field };
}

function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ message: string; field: "email" | "password" | null } | null>(null);
  const [pending, start] = useTransition();
  const emailId = useId();
  const passwordId = useId();
  const tooShort = password.length > 0 && password.length < 10;

  return (
    <form
      className="card stack-sm"
      aria-labelledby="register-heading"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          try {
            await api("/api/account/register", { body: { email, password } });
            setPassword("");
            router.push("/today");
          } catch (err) {
            setError(fieldErrors(err));
          }
        });
      }}
    >
      <h2 id="register-heading" style={{ fontSize: 20, lineHeight: "28px" }}>Save my progress</h2>
      <p className="muted">Keep this work and continue from this point on another device. Your guest progress transfers to the new account in one step.</p>
      {error && <p className="alert error" role="alert">{error.message}</p>}
      <label className="field" htmlFor={emailId}>
        <span>Email</span>
        <input id={emailId} type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={error?.field === "email" || undefined} disabled={pending} />
      </label>
      <label className="field" htmlFor={passwordId}>
        <span>Password</span>
        <span className="help">At least 10 characters. A short phrase you will remember works well.</span>
        <input id={passwordId} type="password" name="new-password" autoComplete="new-password" required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={error?.field === "password" || tooShort || undefined} aria-describedby={tooShort ? `${passwordId}-hint` : undefined} disabled={pending} />
        {tooShort && <span id={`${passwordId}-hint`} className="small" style={{ color: "var(--caution)" }}>{10 - password.length} more character{10 - password.length === 1 ? "" : "s"} needed.</span>}
      </label>
      <div className="row">
        <button type="submit" className="btn btn-primary" disabled={pending || !email || password.length < 10}>{pending ? "Saving…" : "Create account and save"}</button>
      </div>
      <p className="small muted">No CV or employer is required. You can export or delete everything from Your profile at any time.</p>
    </form>
  );
}

function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ message: string; field: "email" | "password" | null } | null>(null);
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [pending, start] = useTransition();
  const emailId = useId();
  const passwordId = useId();

  function choose(choice: "keep_account" | "switch_to_guest"): void {
    setError(null);
    start(async () => {
      try {
        await api("/api/account/claim-guest", { body: { choice } });
        router.push("/today");
      } catch (err) {
        setError(fieldErrors(err));
      }
    });
  }

  if (preview) {
    return (
      <section className="card stack" aria-labelledby="merge-heading">
        <h2 id="merge-heading" style={{ fontSize: 20, lineHeight: "28px" }}>You are signed in. Which progress should we continue with?</h2>
        <p className="muted">Both this session and your account have work in them. Nothing is merged or overwritten until you choose. Whichever you set aside is kept: guest work stays for its seven-day window, and account work stays archived and exportable.</p>
        {error && <p className="alert error" role="alert">{error.message}</p>}
        <div className="two-col">
          <ProgressCard title="Your account's progress" s={preview.account} />
          <ProgressCard title="This session's progress" s={preview.guest} />
        </div>
        <div className="row">
          <button type="button" className="btn btn-primary" disabled={pending} onClick={() => choose("keep_account")}>Keep my account&rsquo;s progress</button>
          <button type="button" className="btn btn-secondary" disabled={pending} onClick={() => choose("switch_to_guest")}>Use this session&rsquo;s progress instead</button>
        </div>
      </section>
    );
  }

  return (
    <form
      className="card stack-sm"
      aria-labelledby="signin-heading"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          try {
            const r = await api<{ email: string | null; mergePreview: MergePreview | null }>("/api/account/login", { body: { email, password } });
            setPassword("");
            if (r.mergePreview) setPreview(r.mergePreview);
            else router.push("/today");
          } catch (err) {
            setError(fieldErrors(err));
          }
        });
      }}
    >
      <h2 id="signin-heading" style={{ fontSize: 20, lineHeight: "28px" }}>Sign in</h2>
      <p className="muted">Continue with an account you already have. If this session also has progress, you will choose which to keep before anything changes.</p>
      {error && <p className="alert error" role="alert">{error.message}</p>}
      <label className="field" htmlFor={emailId}>
        <span>Email</span>
        <input id={emailId} type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={error?.field === "email" || undefined} disabled={pending} />
      </label>
      <label className="field" htmlFor={passwordId}>
        <span>Password</span>
        <input id={passwordId} type="password" name="current-password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={error?.field === "password" || undefined} disabled={pending} />
      </label>
      <div className="row">
        <button type="submit" className="btn btn-primary" disabled={pending || !email || !password}>{pending ? "Signing in…" : "Sign in"}</button>
      </div>
    </form>
  );
}

function ProgressCard({ title, s }: { title: string; s: Summary }) {
  return (
    <div className="card compact muted-surface">
      <h3 style={{ fontSize: 16, lineHeight: "24px" }}>{title}</h3>
      <dl style={{ margin: 0 }}>
        <dt className="small muted">Goal</dt>
        <dd style={{ margin: "0 0 8px" }}>{s.goal ?? <span className="muted">No goal set</span>}</dd>
        <dt className="small muted">Attempts</dt>
        <dd style={{ margin: "0 0 8px" }}>{s.attempts}</dd>
        <dt className="small muted">Pieces of work</dt>
        <dd style={{ margin: 0 }}>{s.artefacts}</dd>
      </dl>
    </div>
  );
}
