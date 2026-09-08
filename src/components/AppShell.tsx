import Link from "next/link";
import { NavLinks } from "./NavLinks";

/**
 * Three-destination shell (D07): rail at 1280px+, top navigation 768–1279px, bottom navigation below 768px.
 * The utility area shows the current goal, profile access and help.
 */
export function AppShell({ children, goalLabel, learnerLabel, fixtureMode }: { children: React.ReactNode; goalLabel: string | null; learnerLabel: string; fixtureMode: boolean }) {
  return (
    <div className="shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <aside className="rail" aria-label="Primary">
        <Link href="/today" className="brand">Learn AI</Link>
        <nav aria-label="Main">
          <NavLinks variant="rail" />
        </nav>
        <div className="grow" />
        <nav aria-label="Utilities">
          <NavLinks variant="rail-secondary" />
        </nav>
      </aside>
      <div>
        <header className="topnav">
          <Link href="/today" className="brand">Learn AI</Link>
          <nav aria-label="Main">
            <NavLinks variant="top" />
          </nav>
          <nav aria-label="Utilities" className="row">
            <NavLinks variant="top-secondary" />
          </nav>
        </header>
        <main id="main" tabIndex={-1} className="main">
          <div className="utility">
            <span className="goal-label" title={goalLabel ?? undefined}>{goalLabel ? `Goal: ${goalLabel}` : "No goal set yet"}</span>
            <span className="row small">
              {fixtureMode && <span className="badge caution" title="No model provider is configured. Personal examples, tutoring and written grading use reviewed deterministic fixtures.">Development fixture mode</span>}
              <span>{learnerLabel}</span>
              <Link href="/help">Help</Link>
            </span>
          </div>
          {children}
        </main>
        <nav className="bottomnav" aria-label="Main">
          <NavLinks variant="bottom" />
        </nav>
      </div>
    </div>
  );
}
