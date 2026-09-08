import Link from "next/link";
import type { Metadata } from "next";
import { currentIdentity } from "@/server/lib/session";
import { PreferencesForm } from "@/components/PreferencesForm";
import { LogoutButton } from "@/components/LogoutButton";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

/** Secondary utility (D07): account status, saving progress or signing in, log out, and preferences. */
export default async function SettingsPage() {
  const identity = (await currentIdentity())!;
  const signedIn = identity.kind === "account";
  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <div>
        <h1>Settings</h1>
        <p className="prose muted">Your account and how sessions work. Experience facts and your data controls live in <Link href="/profile">Your profile</Link>.</p>
      </div>

      <section className="card" aria-labelledby="account-heading">
        <h2 id="account-heading">Account</h2>
        {signedIn ? (
          <div className="stack-sm">
            <p>Signed in as <strong>{identity.email ?? "your account"}</strong>. Your progress is saved and available on any device.</p>
            <LogoutButton />
          </div>
        ) : (
          <div className="stack-sm">
            <p><span className="badge neutral">Guest session</span></p>
            <p className="muted">Your work is kept for seven days on this browser. Save your progress to keep it and continue from this point on another device.</p>
            <div className="row">
              <Link className="btn btn-primary" href="/account">Save my progress</Link>
              <Link className="btn btn-secondary" href="/account">Sign in</Link>
            </div>
            <div style={{ marginTop: 8 }}>
              <p className="small muted" style={{ marginBottom: 8 }}>Leaving without saving ends this guest session on this device.</p>
              <LogoutButton label="End this session" />
            </div>
          </div>
        )}
      </section>

      <section className="card" aria-labelledby="preferences-heading">
        <h2 id="preferences-heading">Preferences</h2>
        <PreferencesForm preferences={identity.preferences} />
      </section>
    </div>
  );
}
