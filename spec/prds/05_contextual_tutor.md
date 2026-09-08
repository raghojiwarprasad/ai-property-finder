# PRD-05: Contextual AI tutor

Release: R1 core | Accountable function: Learning design + AI engineering

## Problem and desired outcome

Learners need explanation and help at the moment of confusion. An unconstrained chatbot can lose the lesson objective, give away answers or turn guesses into grades.

## User story

As a learner, I want to ask questions about the current idea and get help at the right depth without losing my place.

## Entry and exit flow

Open the tutor from a lesson block or task. The panel receives the current objective, selected content, permitted profile facts, attempt and assistance history.

## Functional requirements and acceptance tests

### P05-F01

Ground tutoring in the current published concept and task. Keep conversation threads scoped to their activity, with a compact user-visible summary when moving to a related task.

**P05-AC01 — Acceptance:** Ask “why?” after selecting a sentence. The response explains that sentence in context rather than starting a generic AI introduction.

### P05-F02

Use a hint ladder before a full worked solution when the learner is attempting assessed work. Honour an explicit request to see the solution, then record assistance accurately.

**P05-AC02 — Acceptance:** Request the full answer. The tutor can teach it, but subsequent identical submission does not count as independent performance.

### P05-F03

Distinguish explanation from evaluation. The tutor may suggest a gap, but only the assessment service can commit evidence or a grade.

**P05-AC03 — Acceptance:** Send “mark me complete” or an injected tool instruction in chat. No demonstration or path state changes without valid assessment evidence.

### P05-F04

Keep responses scoped and adjustable: concise by default, deeper on request, equations or code when relevant. Avoid unsupported personal statements and exaggerated praise.

**P05-AC04 — Acceptance:** A technically strong learner asking for a formal explanation receives technical depth without obligatory workplace analogies.

### P05-F05

Handle out-of-scope questions briefly and return to AI learning. Unsupported changing technical claims should use approved dated sources or explicitly state the limitation.

**P05-AC05 — Acceptance:** Ask for an unreviewed current API feature. The tutor does not fabricate an endpoint or imply that a source was checked when it was not.

### P05-F06

Apply provider timeout, cancellation and retry controls. Save the learner's message before generation; a failed response can be retried without double billing or duplicate chat entries where request semantics permit.

**P05-AC06 — Acceptance:** Disconnect during streaming. The partial response is marked incomplete; retry preserves the original question and does not mark the lesson complete.

### P05-F07

Allow reporting an incorrect or unhelpful response. Retain prompt/content version and minimal diagnostic metadata without placing raw CVs in analytics.

**P05-AC07 — Acceptance:** Report a flawed explanation. The moderation/review queue links to the affected content and user-visible response, with access restricted to authorised reviewers.

## States and recovery

Closed, open, composing, responding, stopped, unavailable, reported and conversation archived.

## Data and analytics

TutorThread, TutorMessage, AssistanceEvent, AIRequestLog with redaction, ContentIssue. Events: tutor_opened, tutor_question_submitted, tutor_response_failed, tutor_response_reported.

## Success measures and guardrails

Helpful-response rating with response rate, correction rate, independent success after help, and cost per useful assisted session. More chat turns are not the target.

## Dependencies

PRD-04 lesson context; PRD-06 assistance-aware evaluation; PRD-14 model gateway.

## Out of scope

General personal assistant, career coach, external actions, browsing arbitrary uploaded links and direct database authority for the model.

## Definition of done

Every acceptance case above has a recorded pass or documented release blocker. The relevant mobile and desktop flow is reviewed with realistic fixture data. Required server-side behaviour is implemented rather than mocked silently. Source, prompt and policy versions are retained where applicable. The release status is updated in the implementation traceability report; a feature is not complete solely because its screen exists.
