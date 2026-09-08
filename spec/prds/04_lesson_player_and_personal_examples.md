# PRD-04: Lesson player and personal examples

Release: R1 core | Accountable function: Learning design + frontend + AI engineering

## Problem and desired outcome

A generic lesson with the learner's name inserted does not explain AI through their experience. Personal relevance must preserve conceptual accuracy and lead to a task.

## User story

As a learner, I want a clear explanation that connects to something I know and lets me apply the idea immediately.

## Entry and exit flow

S04 presents an outcome, bridge, concept, example and activity in a structured learning canvas. Contextual tutor support does not replace the lesson structure.

## Functional requirements and acceptance tests

### P04-F01

Render versioned lesson blocks: orientation, explanation, diagram or example, interaction and feedback. Support progressive delivery without moving an answer field while the learner is using it.

**P04-AC01 — Acceptance:** Delay explanation generation while a reviewed block loads. The learner can read stable content; later blocks do not clear or shift entered work unexpectedly.

### P04-F02

Use only eligible profile facts with source IDs. Label fictional scenarios and do not claim invented personal events. Use a neutral fallback when no relevant fact exists.

**P04-AC02 — Acceptance:** A CV mentions construction operations but no named project. The lesson may say “Imagine a project” but cannot assert the learner managed a specific hospital build.

### P04-F03

Preserve the canonical concept and any important analogy limits. A personalised variant must pass factual and concept-alignment checks before display.

**P04-AC03 — Acceptance:** A retrieval explanation cannot say source retrieval guarantees correctness. A failed validator routes to a reviewed general explanation.

### P04-F04

Provide Explain differently, Hint, Go deeper and I know this in context. Record assistance separately from evidence and keep the primary goal stable.

**P04-AC04 — Acceptance:** Reveal a worked answer, then submit it. The result is saved as assisted and does not satisfy an independent evidence requirement.

### P04-F05

Offer “This example does not fit me” with change-for-this-lesson and correct-profile options. The learner can switch to a general example without re-onboarding.

**P04-AC05 — Acceptance:** Reject a construction analogy. The concept remains the same, the replacement is clearly saved as the preference, and no skill evidence is removed.

### P04-F06

Include a fresh application or transfer task for every lesson that contributes to demonstration. Reading and scrolling only establish exposure.

**P04-AC06 — Acceptance:** Scroll to the end and click Continue without an assessed task. The capability can become introduced but not demonstrated.

### P04-F07

Save block position, user work and content version. If content is corrected later, historical attempts still refer to the original version.

**P04-AC07 — Acceptance:** Publish a new lesson version while a learner has a draft. Resume shows the saved version or an explicit migration notice; grading uses the matching rubric.

## States and recovery

Preparing, readable partial content, ready, input active, help open, feedback pending, complete and personalised-example unavailable.

## Data and analytics

LessonVersion, LessonInstance, ContextBinding, BlockState, AssistanceEvent, Attempt. Events: lesson_started, context_example_rejected, explanation_changed, hint_requested, lesson_exposure_completed.

## Success measures and guardrails

Independent task performance, transfer performance, personal-example usefulness and factual correction rate. Separate relevance from learning uplift.

## Dependencies

PRD-01 facts; PRD-05 tutor; PRD-06 grading; PRD-13 reviewed content.

## Out of scope

Autoplay video courses as the only medium, generic endless chat, unlimited unreviewed curriculum generation and fixed learning-style labels.

## Definition of done

Every acceptance case above has a recorded pass or documented release blocker. The relevant mobile and desktop flow is reviewed with realistic fixture data. Required server-side behaviour is implemented rather than mocked silently. Source, prompt and policy versions are retained where applicable. The release status is updated in the implementation traceability report; a feature is not complete solely because its screen exists.
