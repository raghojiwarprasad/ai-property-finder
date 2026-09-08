import Link from "next/link";

export function OnboardingShell({ step, children }: { step: "1 of 2" | "2 of 2" | null; children: React.ReactNode }) {
  return (
    <div className="shell shell-single">
      <a href="#main" className="skip-link">Skip to content</a>
      <div>
        <header className="topnav" style={{ display: "flex" }}>
          <Link href="/" className="brand">Learn AI</Link>
          <nav aria-label="Utilities" className="row">
            <Link className="navlink" href="/account">Log in</Link>
          </nav>
        </header>
        <main id="main" tabIndex={-1} className="main" style={{ maxWidth: 760 }}>
          {step && <div className="eyebrow">Step {step}</div>}
          {children}
        </main>
      </div>
    </div>
  );
}
