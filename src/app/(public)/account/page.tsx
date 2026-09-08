import Link from "next/link";
import type { Metadata } from "next";
import { currentIdentity } from "@/server/lib/session";
import { AccountForms } from "@/components/AccountForms";

export const metadata: Metadata = { title: "Save your progress" };
export const dynamic = "force-dynamic";

/** S10 account step: a minimal header, then register or sign in. Reached from "Save my progress" or "Log in". */
export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const identity = await currentIdentity();
  const initialTab = sp.tab === "signin" ? "signin" : "register";
  return (
    <div className="shell shell-single">
      <a href="#main" className="skip-link">Skip to content</a>
      <div>
        <header className="topnav" style={{ display: "flex" }}>
          <span className="brand">Learn AI</span>
          <nav aria-label="Utilities" className="row">
            <Link className="navlink" href="/today">Back</Link>
          </nav>
        </header>
        <main id="main" className="main" style={{ maxWidth: 720 }}>
          <div className="stack">
            <div>
              <h1>Keep your progress</h1>
              <p className="prose muted">
                {identity?.kind === "account"
                  ? `You are already signed in as ${identity.email ?? "your account"}. You can sign in to a different account below.`
                  : "Save this session to an account, or sign in to one you already have. Either way, nothing is merged without your say-so."}
              </p>
            </div>
            <AccountForms initialTab={initialTab} />
          </div>
        </main>
      </div>
    </div>
  );
}
