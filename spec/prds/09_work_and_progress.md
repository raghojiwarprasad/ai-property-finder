# PRD-09: My work and visible progress

Release: R1 core | Accountable function: Product design + backend

## Problem and desired outcome

Learners need tangible evidence that they are improving, with a distinction between work they produced independently and work produced with help.

## User story

As a learner, I want to see what I have made, how it improved and which capabilities it demonstrates.

## Entry and exit flow

S09 lists work and opens a versioned item detail. Completion summaries link back to evidence instead of showing a universal skill score.

## Functional requirements and acceptance tests

### P09-F01

Save structured artefacts, relevant source material, task/rubric versions and feedback. Associate every demonstrated capability with its evidence.

**P09-AC01 — Acceptance:** Open a claimed capability. The learner can inspect the supporting task and result rather than a badge with no provenance.

### P09-F02

Provide first-versus-latest comparison with criterion-level improvements. Preserve earlier versions and assistance labels.

**P09-AC02 — Acceptance:** Compare a first task brief with a revised one. The view highlights added source constraints and records whether a worked solution was used.

### P09-F03

Separate milestone completion, demonstrated capability and review due. Do not turn these into one unexplained progress percentage.

**P09-AC03 — Acceptance:** A completed milestone with a due recall check remains historically complete and shows a separate review status.

### P09-F04

Allow export of selected work in readable Markdown or PDF after a preview; full account export follows PRD-10. Export does not publish content.

**P09-AC04 — Acceptance:** Export an item. No public URL or social post is created and the output includes the correct task and assistance context.

### P09-F05

Make empty and incomplete states useful. A draft is clearly labelled and cannot appear as a completed demonstration.

**P09-AC05 — Acceptance:** Save a partial worksheet. My work shows Draft and offers Resume; it does not award a finished milestone.

## States and recovery

Empty, draft, submitted, feedback pending, reviewed, revised, exported and deleted.

## Data and analytics

Artefact, ArtefactVersion, EvidenceLink, ExportJob. Events: work_saved, work_compared, work_exported, evidence_detail_opened.

## Success measures and guardrails

Learner ability to explain their progress; return to saved work; independent artefact quality; voluntary reuse. Number of generated artefacts alone is insufficient.

## Dependencies

PRD-06 evaluation; PRD-10 privacy; PRD-11 optional sharing.

## Out of scope

Public professional profile, employment credential, resume builder, portfolio ranking and social follower counts.

## Definition of done

Every acceptance case above has a recorded pass or documented release blocker. The relevant mobile and desktop flow is reviewed with realistic fixture data. Required server-side behaviour is implemented rather than mocked silently. Source, prompt and policy versions are retained where applicable. The release status is updated in the implementation traceability report; a feature is not complete solely because its screen exists.
