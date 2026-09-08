# PRD-02: Goal interpretation and starting point

Release: R1 core | Accountable function: Product + curriculum

## Problem and desired outcome

Learners express goals in ordinary language. The system must translate them into supported AI capabilities without forcing a profession-based course or promising unavailable depth.

## User story

As a learner, I want my chosen ambition to determine the destination and my evidence to determine where I begin.

## Entry and exit flow

S03 accepts free text or an editable suggestion. Show one first milestone and a concise interpretation. Start opens S04; the full route is available later in S07.

## Functional requirements and acceptance tests

### P02-F01

Support five goal suggestions plus free text of 5–1,000 characters. Persist the original wording separately from the interpreted target and allow later correction.

**P02-AC01 — Acceptance:** Enter “I want to understand AI papers eventually” as a nontechnical learner. Research remains the destination and the original words remain retrievable.

### P02-F02

Map goals to a reviewed capability graph with coverage metadata. Proposed specialist goals may reference published prerequisites; unpublished specialist milestones are labelled Planned.

**P02-AC02 — Acceptance:** Request an unsupported niche topic. No invented lesson is marked published; the learner sees available foundations and the specific coverage gap.

### P02-F03

Keep one active primary goal. Optional depth branches are bounded and do not silently replace it. A goal change produces a preview of carried evidence and new prerequisites.

**P02-AC03 — Acceptance:** Switch from marketing to building. Source-checking evidence carries forward where depth matches; programming remains unknown; the original work is preserved.

### P02-F04

Use CV familiarity only to select an initial check or example. Check out of foundations through appropriate independent evidence, never through seniority or self-report alone.

**P02-AC04 — Acceptance:** A senior developer with a wrong evaluation answer receives targeted teaching; a learner without a degree who passes a fresh prerequisite check can advance.

### P02-F05

Resolve ambiguity with at most one optional inline clarification before starting. If skipped, use broad AI foundations and mark the interpretation as provisional.

**P02-AC05 — Acceptance:** Enter “learn everything”. Skipping clarification still opens a useful foundation lesson; it does not enter a repeated question loop.

### P02-F06

Persist optional 10/20/40-minute session preference and an editable first milestone. Do not present long-range duration as a guaranteed time to expertise.

**P02-AC06 — Acceptance:** Choose 10 minutes. The planner proposes a bounded first task and preserves the same destination rather than lowering the goal.

### P02-F07

Enforce AI-only subject scope. Offer a relevant AI interpretation for an unrelated goal and allow the user to revise or decline.

**P02-AC07 — Acceptance:** Enter “train for a marathon”. The system does not produce a fitness course; it offers an AI-related reformulation or returns to goal entry.

## States and recovery

No goal, drafting, interpreting, ready, ambiguous, unsupported topic, changed and archived. A model failure offers the reviewed goal suggestions without pretending free-text interpretation succeeded.

## Data and analytics

Goal, GoalVersion, CoverageRecord, InitialCheckProposal, PathRevision. Events: goal_submitted, goal_interpretation_edited, first_activity_opened, goal_changed.

## Success measures and guardrails

Goal-to-first-task conversion; user correction of interpretations; early route relevance; unsupported-goal frequency. Track background fairness in test fixtures without collecting unnecessary sensitive analytics.

## Dependencies

PRD-01 context; PRD-07 prerequisite policy; PRD-13 content coverage.

## Out of scope

Career trajectory, hiring likelihood, salaries, colleges, professional placement and automatic external course purchases.

## Definition of done

Every acceptance case above has a recorded pass or documented release blocker. The relevant mobile and desktop flow is reviewed with realistic fixture data. Required server-side behaviour is implemented rather than mocked silently. Source, prompt and policy versions are retained where applicable. The release status is updated in the implementation traceability report; a feature is not complete solely because its screen exists.
