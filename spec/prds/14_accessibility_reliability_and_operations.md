# PRD-14: Accessibility, reliability and release operations

Release: R1 core | Accountable function: Engineering + design + quality

## Problem and desired outcome

The learning experience fails if it loses work, cannot be used accessibly, leaks private data or disguises model outages as progress.

## User story

As a learner, I want the product to work reliably across devices and preserve my effort when something fails.

## Entry and exit flow

Applies across every screen, background job, model request and data operation. Quality gates precede external pilot access.

## Functional requirements and acceptance tests

### P14-F01

Target WCAG 2.2 AA with keyboard completion of the full core loop, meaningful labels, visible focus, reflow, text alternatives and accessible status announcements.

**P14-AC01 — Acceptance:** Complete onboarding, a lesson, an assessment, feedback review and data controls with keyboard and screen reader; test 200% zoom and 390 px layout.

### P14-F02

Autosave drafts and expose status. Network failures preserve local unsynced text with a retry queue; sensitive content must not remain indefinitely on shared devices after logout.

**P14-AC02 — Acceptance:** Type an answer, lose connectivity, reconnect and submit. The latest draft survives and logout clears local private caches.

### P14-F03

Authorise every object access server-side for authenticated and guest identities. Rate-limit public and expensive endpoints; keep provider secrets on the server.

**P14-AC03 — Acceptance:** Attempt cross-account access for uploads, messages, attempts, exports and shares. Every private object route denies unauthorised access.

### P14-F04

Bound model latency, retries and spend. Validate schema and grounding; fall back to reviewed content when appropriate. A mock response or deterministic fixture is visibly labelled in development and never represented as live AI.

**P14-AC04 — Acceptance:** Disable the provider. The user sees an honest fallback or pending state; no fake personalised success, fabricated grade or silent pass is produced.

### P14-F05

Instrument request status, costs, queue age and content/version errors with redaction. Alert on lost evaluations, deletion failures, elevated error rates and suspicious access.

**P14-AC05 — Acceptance:** Induce an evaluation queue failure. Operations can identify affected attempt IDs and recover them without exposing CV text in general logs.

### P14-F06

Deploy using isolated environments, reversible migrations, tested backups and a rollback plan. Demo fixtures and production learner data must not share access paths.

**P14-AC06 — Acceptance:** Restore a test backup and roll back a release in a staging environment; learner records remain consistent and demo credentials cannot access production.

### P14-F07

Treat performance figures as initial service targets: non-model API p95 under 1 second, first useful lesson block p95 under 15 seconds after goal submission when upstream services are healthy, and durable draft save p95 under 2 seconds. Report provider failures separately and in the end-to-end experience.

**P14-AC07 — Acceptance:** Load-test the core loop at the declared pilot concurrency. Report actual percentiles and error rates; do not mark the gate passed from a local mocked run.

## States and recovery

Healthy, degraded, offline, recovering, maintenance and blocked operation. Each user-visible failure has a saved-state explanation and next action.

## Data and analytics

RequestLog, Job, UsageLedger, Incident, AuditEvent and deployment metadata, with strict redaction.

## Success measures and guardrails

Core-loop completion reliability, data loss, accessibility defects, p95 latency, model cost and recovery time. Zero cross-user disclosure is a release requirement.

## Dependencies

All PRDs; architecture and launch checklists.

## Out of scope

Formal compliance certification, arbitrary code execution before isolation gate, model self-modification and production changes without the deployment authority required by the implementation environment.

## Definition of done

Every acceptance case above has a recorded pass or documented release blocker. The relevant mobile and desktop flow is reviewed with realistic fixture data. Required server-side behaviour is implemented rather than mocked silently. Source, prompt and policy versions are retained where applicable. The release status is updated in the implementation traceability report; a feature is not complete solely because its screen exists.
