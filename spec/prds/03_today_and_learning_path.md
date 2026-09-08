# PRD-03: Today and My path

Release: R1 core | Accountable function: Product design + application engineering

## Problem and desired outcome

A large curriculum can create choice paralysis. Learners need one useful next action plus enough orientation to trust the journey.

## User story

As a returning learner, I want to continue quickly and understand why the recommended task matters to my goal.

## Entry and exit flow

Today opens S06 with one next action; My path opens S07 for orientation. Active drafts resume before a new activity unless the user opts out.

## Functional requirements and acceptance tests

### P03-F01

Show one primary next activity with capability outcome, plain-language reason, duration range and Continue. Keep a due review secondary unless it is the chosen activity.

**P03-AC01 — Acceptance:** With several unfinished milestones and three reviews due, the screen still has one primary action and a bounded review offer.

### P03-F02

Resume the last saved task, draft and scroll or step position. A later recommendation must not replace the in-progress task without a learner choice.

**P03-AC02 — Acceptance:** Close the browser while drafting an answer. Reopen on another authenticated device and continue the same version without losing input.

### P03-F03

Display milestone outcomes and evidence requirements, not only topic names. Available and Planned content must use distinct labels and actions.

**P03-AC03 — Acceptance:** A planned research milestone can be inspected but cannot launch a fabricated lesson or be counted as available course inventory.

### P03-F04

Explain route changes using reason codes and linked evidence. Allow inspection of prior path versions and undo of an optional branch when structurally valid.

**P03-AC04 — Acceptance:** After two independent failures, show the targeted repair and the affected concept. Undoing an optional branch does not erase graded work.

### P03-F05

Offer shorter session, deeper exploration and prerequisite check controls. Previewing later content does not award prerequisite completion.

**P03-AC05 — Acceptance:** Select “I know this” on a prerequisite. A fresh check is offered; merely viewing the answer does not mark it demonstrated.

### P03-F06

Handle no-new-content and completed-goal states with useful practice, review or a different learner-selected goal. Do not manufacture endless work.

**P03-AC06 — Acceptance:** Complete all published milestone requirements. Today accurately reports completion and available optional review without inventing a locked next chapter.

## States and recovery

First visit, active draft, next task ready, review due, milestone complete, goal complete, content unavailable and recommendation pending.

## Data and analytics

ActivityAssignment, PathRevision, ResumeState, ReviewSchedule. Events: next_activity_viewed, next_activity_started, path_reason_opened, session_shortened, milestone_completed.

## Success measures and guardrails

Time from returning visit to meaningful work; resumption success; route override reasons; unnecessary repetition reports. Do not optimise only for time on site.

## Dependencies

PRD-07 recommendation and evidence; PRD-04 player; PRD-09 work records.

## Out of scope

Course marketplace, multi-goal dashboard, social feed, arbitrary graph editor and career planning.

## Definition of done

Every acceptance case above has a recorded pass or documented release blocker. The relevant mobile and desktop flow is reviewed with realistic fixture data. Required server-side behaviour is implemented rather than mocked silently. Source, prompt and policy versions are retained where applicable. The release status is updated in the implementation traceability report; a feature is not complete solely because its screen exists.
