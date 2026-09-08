# PRD-07: Adaptive next steps and spaced review

Release: R1 core | Accountable function: Learning science + backend

## Problem and desired outcome

A fixed course ignores evidence, while unconstrained generation can create unstable or incoherent paths. Adaptation should be useful, bounded and explainable.

## User story

As a learner, I want my path to respond to my work and feedback while keeping my destination and progress understandable.

## Entry and exit flow

Valid evidence or explicit learner feedback triggers a recommendation proposal. The server checks prerequisites, availability and policy limits, then saves a path revision for the next natural transition.

## Functional requirements and acceptance tests

### P07-F01

Implement explicit teach, practise, check, transfer, review and project actions. Every recommendation includes reason code, supporting evidence IDs and goal/content/policy versions.

**P07-AC01 — Acceptance:** Replay saved evidence against the same deterministic policy. The next recommendation and reason are reproducible without a new model call.

### P07-F02

Preserve current work while changing future activities. Use optimistic concurrency on learner-state and goal versions to reject stale proposals.

**P07-AC02 — Acceptance:** Change the goal while a recommendation is generating. The late result cannot overwrite the new goal's route.

### P07-F03

Treat unknown evidence separately from failed evidence. Prerequisite checks may shorten the path, but CV signals alone cannot satisfy gates.

**P07-AC03 — Acceptance:** A learner with no data sees a check or introductory activity; a failed fresh check triggers repair; the two cases have distinct reason codes.

### P07-F04

Change support or prerequisites after repeated specific failures. Do not repeat identical questions indefinitely or lower the learner's destination.

**P07-AC04 — Acceptance:** Two distinct failures on evidence boundaries select a counterexample and focused practice. The research or builder goal remains unchanged.

### P07-F05

Schedule review with configurable initial defaults of roughly 2, 7 and 21 days after successful checks. Track retention separately and cap daily review load to the session budget.

**P07-AC05 — Acceptance:** Return after a month with many due items. The planner offers a bounded relevant check, retains historical demonstrations and does not create a punitive backlog.

### P07-F06

Allow goal changes and optional exploration with a recoverable revision. Carry evidence only when capability, depth and validity requirements match.

**P07-AC06 — Acceptance:** Switch from an explain-level goal to implementation. Conceptual evidence carries as explanation; it does not satisfy code-building requirements.

### P07-F07

If no eligible published content exists, return an explicit coverage limitation and available review options. Do not invent a lesson ID.

**P07-AC07 — Acceptance:** Reach the end of the research starter. The system offers supported review and a Planned milestone rather than fabricated advanced content.

## States and recovery

Stable, proposal pending, revised, user overridden, review due, no eligible content and stale proposal discarded.

## Data and analytics

CapabilityProjection, Recommendation, ReviewSchedule, PathRevision, PolicyVersion. Events: recommendation_created, recommendation_overridden, review_completed, coverage_gap_reached.

## Success measures and guardrails

Independent success after adaptation, repeated failure rate, unnecessary review reports and proportion of recommendations learners understand. Test against a simpler baseline.

## Dependencies

PRD-02 goals; PRD-06 evidence; PRD-13 prerequisite graph and coverage.

## Out of scope

Reinforcement learning policy in R1, opaque personal success scores, unlimited generated courses and career transitions.

## Definition of done

Every acceptance case above has a recorded pass or documented release blocker. The relevant mobile and desktop flow is reviewed with realistic fixture data. Required server-side behaviour is implemented rather than mocked silently. Source, prompt and policy versions are retained where applicable. The release status is updated in the implementation traceability report; a feature is not complete solely because its screen exists.
