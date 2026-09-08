# PRD-08: Practice environments and simulations

Release: R1 constrained practice; R2 isolated code execution | Accountable function: Learning design + platform engineering

## Problem and desired outcome

Learners need to make decisions and observe consequences. A decorative agent builder can look impressive without teaching or producing interpretable evidence.

## User story

As a learner, I want a safe place to try an AI task, see what happened and improve it with targeted feedback.

## Entry and exit flow

S08 is launched from a lesson or milestone. The learner receives a brief, editable controls, a run action, observable output and a feedback route back into teaching.

## Functional requirements and acceptance tests

### P08-F01

Provide reviewed practice types: task-brief editor, evidence comparison, retrieval explorer and approval-boundary simulation. Every exercise names the objective, available inputs and evaluation criteria.

**P08-AC01 — Acceptance:** Run a retrieval task with an irrelevant source. The trace shows what was retrieved and the feedback identifies that failure rather than scoring only answer fluency.

### P08-F02

Label simulations visibly and use synthetic data. Simulated emails, purchases and tool calls cannot contact real services or move money.

**P08-AC02 — Acceptance:** Configure an approval exercise incorrectly. The simulation reports the unauthorised action as a fictional outcome and performs zero external actions.

### P08-F03

Evaluate meaningful choices and observable outputs with a server-side evaluator. Running a simulation without making or explaining a decision does not prove capability.

**P08-AC03 — Acceptance:** Click Run on the default configuration. The product records execution but requires the task evidence contract before demonstration.

### P08-F04

Keep attempts and configurations versioned. Enable compare, reset with unsaved-work protection, and retry with a new scenario where independent evidence is needed.

**P08-AC04 — Acceptance:** Revise an approval threshold after a hint. Show the improvement as assisted, then use a fresh scenario to assess independence.

### P08-F05

Code execution is disabled until a sandbox with isolation, no default network, resource quotas, timeout, filesystem boundaries and secrets exclusion is implemented and tested.

**P08-AC05 — Acceptance:** Before the sandbox gate passes, the product offers code reading or configuration tasks. It never runs arbitrary learner code in the application process.

### P08-F06

A simulation failure produces capability-specific evidence and a repair recommendation. Distinguish environment failure from a learner mistake.

**P08-AC06 — Acceptance:** A sandbox timeout caused by infrastructure is labelled an execution problem; it does not reduce the learner's conceptual state.

## States and recovery

Brief ready, editing, running, result ready, run failed, grading pending, compared and reset.

## Data and analytics

PracticeTemplateVersion, WorkspaceDraft, Run, Trace, Attempt, ArtefactVersion. Events: practice_started, practice_run, practice_run_failed, configuration_revised, practice_demonstrated.

## Success measures and guardrails

Independent task success, quality of error diagnosis, time to repair, infrastructure failure and cost per completed practice task.

## Dependencies

PRD-06 assessment; PRD-09 work; PRD-14 execution isolation.

## Out of scope

General agent marketplace, live third-party integrations, autonomous external actions, unrestricted terminals and production deployment from the lesson.

## Definition of done

Every acceptance case above has a recorded pass or documented release blocker. The relevant mobile and desktop flow is reviewed with realistic fixture data. Required server-side behaviour is implemented rather than mocked silently. Source, prompt and policy versions are retained where applicable. The release status is updated in the implementation traceability report; a feature is not complete solely because its screen exists.
