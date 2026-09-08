# PRD-11: Useful sharing and recipient learning

Release: R2 after core learning gate | Accountable function: Growth + product + security

## Problem and desired outcome

The product should spread through useful learning and work. Sharing must not expose a CV or turn learning into forced promotion.

## User story

As a learner, I want to share a useful challenge or selected output while controlling exactly what others see.

## Entry and exit flow

After meaningful work, open S11 preview. Publish a sanitised snapshot only on explicit action. Recipients try a bounded challenge before optional onboarding.

## Functional requirements and acceptance tests

### P11-F01

Offer share only after a useful eligible activity, without blocking continuation. No contact import, automatic posting or mandatory referral.

**P11-AC01 — Acceptance:** Dismiss the share prompt. The learner continues with no penalty or repeated modal in the same session.

### P11-F02

Create an immutable sanitised snapshot from approved fields. Exclude CV facts, employer names, private scores and full tutor transcripts by default.

**P11-AC02 — Acceptance:** A private task contains a named employer. The default preview uses neutral context and the public payload contains no private profile object.

### P11-F03

Require a preview with explicit publication confirmation. Creator identity is optional; include assistance and assessment scope when sharing work.

**P11-AC03 — Acceptance:** Publish a model-assisted artefact. The snapshot does not imply independent authorship or professional certification.

### P11-F04

Use unguessable share tokens, rate limits and revocation. Public snapshots cannot reference private object URLs. Default shared pages to no indexing in the initial implementation.

**P11-AC04 — Acceptance:** Revoke a link and try an embedded asset URL. Neither continues to expose the revoked private snapshot.

### P11-F05

Recipient flow gives a short task and feedback before asking for a CV or account. Attribution links use minimal privacy-preserving identifiers.

**P11-AC05 — Acceptance:** Open a shared challenge as a new visitor. They can try it and receive feedback without accessing the creator's learning history.

### P11-F06

Measure the full funnel from qualified share recipient to their own demonstrated learning and return. Do not call raw views viral growth.

**P11-AC06 — Acceptance:** An analytics report distinguishes bots, page opens, task attempts, personal onboarding and retained demonstrated learners.

## States and recovery

Eligible, preview, publishing, public, revoked, unavailable and abuse-reported.

## Data and analytics

ShareSnapshot, ShareToken, AttributionEvent, AbuseReport. Events: share_previewed, share_published, shared_task_attempted, shared_learner_activated, share_revoked.

## Success measures and guardrails

New demonstrated learners per sharing learner, recipient task completion and retained learning; privacy incidents and unwanted prompts as guardrails.

## Dependencies

PRD-09 work; PRD-10 control; PRD-14 public endpoint isolation.

## Out of scope

Social network, public ranking, referral cash, affiliate marketplace and guaranteed growth claims.

## Definition of done

Every acceptance case above has a recorded pass or documented release blocker. The relevant mobile and desktop flow is reviewed with realistic fixture data. Required server-side behaviour is implemented rather than mocked silently. Source, prompt and policy versions are retained where applicable. The release status is updated in the implementation traceability report; a feature is not complete solely because its screen exists.
