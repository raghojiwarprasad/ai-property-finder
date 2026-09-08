# PRD-06: Assessment, feedback and capability evidence

Release: R1 core | Accountable function: Assessment design + backend

## Problem and desired outcome

Completion and fluent output can mask shallow understanding. Progression needs trustworthy evidence and feedback the learner can act on.

## User story

As a learner, I want to know exactly what I got right, what needs work and whether I can use the concept independently.

## Entry and exit flow

S05 accepts an attempt, saves it, evaluates against the matching rubric and returns criterion-level feedback. Evidence projection runs only after a valid evaluation.

## Functional requirements and acceptance tests

### P06-F01

Support selected response, short explanation, structured worksheet and deterministic simulation evidence. Each item references capability, depth, item family, rubric version and critical criteria.

**P06-AC01 — Acceptance:** Submit an answer to the wrong rubric version. The service rejects the mismatch or resolves the saved version; it does not grade against a different item silently.

### P06-F02

Keep answer keys and hidden tests server-side. The client receives only permitted task content and feedback after submission.

**P06-AC02 — Acceptance:** Inspect page data and network responses before submission. Hidden expected answers and private evaluation cases are absent.

### P06-F03

Save attempts immutably with an idempotency key, assistance history and input version. Repeat requests cannot create extra independent evidence.

**P06-AC03 — Acceptance:** Double-click submit and retry the same request. One attempt and one counted evidence contribution result.

### P06-F04

Use deterministic checks where objective. For written work, require structured criterion judgements supported by answer spans; reject invalid outputs and mark uncertainty as provisional.

**P06-AC04 — Acceptance:** The evaluator claims an answer contains a phrase that is absent. Validation or review catches the mismatch; no automatic demonstration is granted.

### P06-F05

Require the default independent evidence contract from 04_PERSONALISATION_AND_ADAPTATION.md unless the authored capability specifies a stricter contract. Repeated item families and assisted answers do not supply independent evidence.

**P06-AC05 — Acceptance:** Pass the same exposed question twice, then two fresh independent item families including transfer. Only the latter can satisfy the conceptual demonstration contract.

### P06-F06

Return one actionable main gap and an appropriate next action. Distinguish conceptual errors, missing evidence, partial work and unavailable grading.

**P06-AC06 — Acceptance:** An answer with good output format but no source restriction receives targeted feedback on evidence boundaries rather than a generic “incorrect”.

### P06-F07

Support grade appeal and append-only re-evaluation. Recompute derived evidence and dependent recommendations when an accepted appeal changes a material grade.

**P06-AC07 — Acceptance:** Overturn a false negative. Preserve the original record, attach the revised grade and update the capability state without duplicate attempts.

### P06-F08

Do not infer ability from speed, accent, verbosity or grammar unless language production is explicitly the assessed skill. Accept equivalent correct reasoning.

**P06-AC08 — Acceptance:** Two answers with the same valid reasoning but different grammar receive equivalent conceptual evaluation; a concise correct answer is not penalised for brevity.

## States and recovery

Draft, saved, evaluating, final, provisional, appeal open, revised and evaluation failed. A provider outage cannot be converted into a pass.

## Data and analytics

TaskItemVersion, RubricVersion, Attempt, Evaluation, EvidenceEvent, Appeal. Events: attempt_submitted, evaluation_completed, evaluation_provisional, grade_appealed, evaluation_revised.

## Success measures and guardrails

Expert agreement, false pass and false fail rates, appeal overturns, independent transfer and delayed retention. Report denominators and uncertainty.

## Dependencies

PRD-13 authored rubrics; PRD-07 evidence projection; PRD-10 data controls.

## Out of scope

AI IQ, credential verification, proctored qualification, professional certification and claims that a model grade is infallible.

## Definition of done

Every acceptance case above has a recorded pass or documented release blocker. The relevant mobile and desktop flow is reviewed with realistic fixture data. Required server-side behaviour is implemented rather than mocked silently. Source, prompt and policy versions are retained where applicable. The release status is updated in the implementation traceability report; a feature is not complete solely because its screen exists.
