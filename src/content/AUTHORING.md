# Content authoring rules

Read `spec/05_CURRICULUM_AND_CONTENT_SYSTEM.md`, `spec/04_PERSONALISATION_AND_ADAPTATION.md`,
`spec/06_USE_CASES.md`, the golden lessons in `spec/examples/` and `spec/prompts/RUNTIME_PROMPT_CONTRACTS.md`
before authoring. Types live in `src/content/types.ts`; the reference module is `src/content/modules/f04.ts`
with `lesson-f04.ts` and `items-f04.ts`.

## Module convention

Each capability has one module `src/content/modules/<capId lower-case>.ts` that exports exactly:

```ts
export const lessons: Lesson[];   // one published lesson
export const items: ItemFamily[]; // three or more item families
export const rubrics: Rubric[];   // every rubric referenced by the items (shared RUB-selected-single already exists)
```

Split into `lesson-<id>.ts` / `items-<id>.ts` if the file gets long, re-exported from the module file.

## What every lesson needs

- `blocks`: orientation, at least one `example` with `sources` where the task is about evidence, at least one `concept`, one `interaction` block referencing `primaryFamily`, one `nextStep`.
- Six `bridges`: one per context domain that plausibly applies (`supplier_comparison`, `operations`, `leadership`,
  `marketing`, `software`, `research`, `community`) plus a mandatory `general` bridge with empty keywords.
  Every non-general bridge must use `scenarioLabel: "imagined"` unless it only restates a confirmed fact type,
  must never assert a specific event in the learner's life, and must carry an `analogyLimit` where the analogy
  could mislead. Bridges begin from something the learner already does ("You have compared supplier quotes")
  and must not repeat an employer or location.
- `simplerExplanation` (plain words, no jargon) and `deeperExplanation` (formal statement, mechanism, limits).
- At least three `misconceptions` with a `repair` each. Item options and feedback reference them by id.
- `sources`: label fictional material as fictional; vendor or API details must be dated or avoided.
- `primaryFamily` (taskKind `check` or `artefact`), `transferFamily` (taskKind `transfer`, a different domain
  from the lesson's examples), `shortFamily` (a 2-minute `selected` item for 10-minute sessions).

## What every item family needs

- Distinct `family` keys. Distinct families change the situation, evidence or decision, not only names.
- `supplied` material is the only source of truth for the task. Never require outside knowledge.
- `prompt.kind`: `selected` (2 to 5 options, exactly one correct unless stated, each wrong option tied to a
  misconception where possible), `written` (question + guidance + minChars), or `worksheet` (labelled fields;
  use for artefacts such as briefs and memos).
- `rubricId` with critical and supporting criteria. Every criterion needs generous `cues` (lower-case
  phrases that a correct answer would plausibly contain, at least 8 for written work, including clumsy
  phrasings) and `antiCues` for phrases that show the criterion was violated. Deterministic cue grading is the
  fallback evaluator when no model provider is configured, so cues decide whether honest answers pass.
- `hints`: 1 to 3 hints that narrow without giving the answer.
- `key.workedAnswer`: a full model answer (shown only after the learner asks for it; the attempt is then assisted).
- `key.evaluationCases`: at least `strong` (pass), `fluent_wrong` (fail), `awkward_correct` (pass, poor grammar,
  correct reasoning), and where relevant `partial` (fail) and `copied_worked` (pass). Tests run these.
- `misconceptionFeedback`: targeted feedback for each misconception id used by options or cues.
- Applied capabilities (`kind: "applied"` in `capabilities.ts`) need one item with `taskKind: "artefact"`
  (worksheet) whose output the learner can reuse (brief, memo, evaluation set, campaign brief).
- `estimatedMinutes` realistic; `status: "published"` only when the item is complete.

## Prohibited

No career, salary, hiring or job-matching content. No claims that a category or a tool is accurate or valuable.
No questions that reward memorising the lesson's phrasing. No vendor leaderboards. No "AI IQ". No invented
biography. No content that a learner could pass by reading only the lesson (transfer must change domain).
