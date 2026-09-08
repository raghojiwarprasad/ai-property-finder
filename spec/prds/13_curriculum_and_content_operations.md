# PRD-13: Curriculum publishing and content operations

Release: R1 core | Accountable function: Curriculum lead + engineering

## Problem and desired outcome

A personalised product still needs trustworthy concepts, prerequisites and assessments. Generated prose alone does not constitute a coherent curriculum.

## User story

As a curriculum reviewer, I want to publish complete learning milestones with valid tasks and detect errors before they affect progression.

## Entry and exit flow

Draft → validate → technical/pedagogical review → publish → monitor → correct or retire. Initial workflow can use versioned content files and a restricted reviewer interface.

## Functional requirements and acceptance tests

### P13-F01

Represent capabilities, prerequisite edges, milestones, lesson templates, item families and rubrics with explicit versions and status. Reject missing references and cycles in prerequisite graphs.

**P13-AC01 — Acceptance:** Publish a bundle with a missing rubric or cyclic prerequisites. Validation blocks publication and names the offending IDs.

### P13-F02

Require every published milestone to have a complete route to its evidence contract, including independent and transfer tasks. Outline-only milestones remain Planned.

**P13-AC02 — Acceptance:** A bundle with teaching text but no eligible independent checks cannot become available in the learner catalogue.

### P13-F03

Review factual accuracy, analogy limits, assessment validity and accessibility. Maintain dated sources for changing technical content and distinguish durable concepts from vendor details.

**P13-AC03 — Acceptance:** A lesson using an outdated API example is flagged for review without silently changing historical task/rubric versions.

### P13-F04

Use model-generated drafts as proposals, never auto-publish specialist curriculum or new prerequisite rules. Runtime adaptation stays inside approved content contracts.

**P13-AC04 — Acceptance:** A tutor proposes an advanced research lesson. It enters the review backlog and is not assigned as published work immediately.

### P13-F05

Preserve old versions referenced by attempts. Material corrections create a new version and a policy for affected evidence; do not silently rewrite old grades.

**P13-AC05 — Acceptance:** Correct a wrong answer key after attempts exist. Affected attempts receive an auditable re-evaluation route with original records retained.

### P13-F06

Provide a content-issue queue with severity, affected versions, owner and resolution. Critical factual or assessment failures can suspend assignment of a content version.

**P13-AC06 — Acceptance:** Report a critical source-checking error. New assignments stop using the affected version while existing work stays accessible with an appropriate notice.

## States and recovery

Draft, validation failed, review requested, approved, published, suspended, superseded and retired.

## Data and analytics

CapabilityVersion, PrerequisiteEdge, MilestoneVersion, LessonVersion, TaskItemVersion, RubricVersion, ContentIssue, ReviewDecision.

## Success measures and guardrails

Coverage completeness, task validity, correction rate, time to resolve severe issues and evaluator agreement. Content volume alone is not a success measure.

## Dependencies

05_CURRICULUM_AND_CONTENT_SYSTEM.md; PRD-06 assessment; restricted reviewer access from PRD-10.

## Out of scope

Open instructor marketplace, unreviewed user-authored courses and automatically generated credentials.

## Definition of done

Every acceptance case above has a recorded pass or documented release blocker. The relevant mobile and desktop flow is reviewed with realistic fixture data. Required server-side behaviour is implemented rather than mocked silently. Source, prompt and policy versions are retained where applicable. The release status is updated in the implementation traceability report; a feature is not complete solely because its screen exists.
