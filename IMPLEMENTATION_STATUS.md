# Implementation status

Factual record for the build from `spec/`. Date: 7 September 2026. Release target: R1 core, with the R2 sharing
loop implemented behind the learning gate and R3 billing deliberately not built.

Status vocabulary (from `spec/10_BUILD_SEQUENCE.md`):

- **implemented**: behaviour exists on the server and in the interface, with an automated check where noted.
- **fixture-only**: the reviewed deterministic path exists and is labelled; no live model path was exercised.
- **provider-unverified**: a live model path is written against the Anthropic SDK but has not been run, because no
  provider key was available in the build environment.
- **content-planned**: the interface shows the item as Planned; no learnable content exists.
- **not built**: deliberately outside this build.

Nothing in this file is a claim of validated learning uplift, real-world usability or production readiness.

## Stage summary

| Stage | Exit criterion (spec) | Status |
| --- | --- | --- |
| 1 Design and interaction contract | Full first session with personal explanation, task, wrong-answer response; planned content looks planned | Implemented as a working app rather than a static prototype. Screenshots at 1440 px and 390 px in `e2e-results/screenshots/` after `npm run test:e2e`. |
| 2 Persistent learning slice | Start, submit, feedback, refresh, continue; two users isolated; persisted evidence | Implemented. `tests/loop.test.ts`, `tests/privacy.test.ts`. |
| 3 CV and contextual AI | Bounded parsing, source-backed facts, correction, runtime examples, tutoring; real provider session | Parsing, facts, correction and fixtures implemented; live provider path written but **provider-unverified**. |
| 4 Adaptive evidence loop | Distinct outcomes for correct, incorrect, assisted, ambiguous; goal changes preserve evidence | Implemented with a deterministic versioned policy. `tests/loop.test.ts`, `tests/practice.test.ts`. |
| 5 Work and constrained practice | Versioned artefacts, comparison, export, deterministic simulations | Implemented (two simulations). Code execution **not built** (sandbox gate not attempted). |
| 6 Pilot hardening | Profile controls, retention, accessibility, provider failure handling, cost reporting, support | Partly: controls, retention and deletion implemented; accessibility checked by keyboard flow only; cost ledger recorded but no reporting UI; no support route; no load test. |
| 7 Growth and commercial | Sanitised sharing; billing after value evidence | Sharing implemented (R2). Billing **not built** (R3). |

## Provider paths

| Task type | Fixture (labelled) | Live path | Exercised live? |
| --- | --- | --- | --- |
| CV extraction | Deterministic extractor with span validation | `extract_experience` via Anthropic SDK, spans validated against source | No |
| Goal interpretation | Reviewed rule mappings | `interpret_goal`, destination checked against catalogue | No |
| Lesson adaptation | Reviewed template bridge selected by facts | `adapt_lesson`, fact ids and warnings validated, template fallback | No |
| Tutor | Hint ladder and lesson-text responses | `tutor`, assistance level recorded server-side | No |
| Written evaluation | Cue-based deterministic evaluator; provisional when inconclusive | `evaluate_written`, spans validated, anti-cue cross-check, provisional on uncertainty | No |
| Recommendation explanation | Reason-code text | `explain_recommendation` (not wired into the UI; server reason text is used) | No |

Live-mode failure handling (timeout, invalid output, refusal, rate limit) is implemented in `src/server/gateway/index.ts`
and consumed by each service with an honest fallback; it is covered by code paths, not by a live test.

## Content inventory

`npm run content:validate` reports 23 capabilities, 14 published lessons, 56 item families, 34 rubrics and 2 simulation
templates. Published milestones after validation: MA1, MA2, MX1 (optional), MB1, MC1, MD1, MD2, ME1. Planned: ME2 to ME7
(the research route beyond the starter). Item families were authored against the evaluation-case rule in
`src/content/AUTHORING.md`; every authored evaluation case grades as labelled under the deterministic evaluator
(`tests/content.test.ts`). Human subject-matter review of the content has **not** happened; see risks.

## Requirement-by-requirement status

Acceptance ids refer to `spec/REQUIREMENTS_TRACEABILITY.csv`. "Test" names the automated check where one exists.

### PRD-01 Onboarding and CV understanding

| Req | Status | Evidence / notes |
| --- | --- | --- |
| P01-F01 | implemented | Signature, size, page and character limits in `experience.ts`; TXT, DOCX (mammoth), PDF (pdf-parse). Test: P01-AC01 (renamed executable, oversized, encrypted-looking PDF rejected with recovery). |
| P01-F02 | implemented | Manual description 20–8,000 chars; "Start with general examples"; any goal selectable without a CV. Test: P01-AC02 covered by loop tests using manual and no-context learners. |
| P01-F03 | implemented (fixture) / provider-unverified | Facts carry source spans, confidence and confirmation; contact details stripped. Test: P01-AC03. |
| P01-F04 | implemented | Instruction-like sentences excluded; injection flagged and shown; model facts must quote the source. Test: P01-AC04. |
| P01-F05 | implemented | Real stages, cancel, 20 s offer of manual entry, 60 s deadline; a cancelled or superseded job never overwrites a newer draft. Test: P01-AC05. |
| P01-F06 | implemented | Editable facts on S03 and in the profile; corrections invalidate bindings and keep evidence. Test: P01-AC06. |
| P01-F07 | implemented | Opaque server cookie, rate limits, owner-scoped upload status. Test: P01-AC07. |

### PRD-02 Goal interpretation

| Req | Status | Evidence / notes |
| --- | --- | --- |
| P02-F01 | implemented | Five suggestions plus free text; original wording kept separately; interpretation editable. Test: P02-AC01. |
| P02-F02 | implemented | Coverage from the validated catalogue; unpublished milestones labelled Planned; niche topics fall to foundations with a gap note. Unsupported specialist goals (UC06) receive a preview only in the sense that no specialist milestone exists. |
| P02-F03 | implemented | One active goal; goal change previews carried evidence and new requirements. Test: P02-AC03. |
| P02-F04 | implemented | CV familiarity selects a check first; only a fresh check advances. Test: P02-AC04. |
| P02-F05 | implemented | One optional clarification; skip starts provisional foundations. Test: P02-AC05 (rules). |
| P02-F06 | implemented | 10/20/40 minutes; short sessions get a smaller task, same destination. Test: P02-AC06. |
| P02-F07 | implemented | Out-of-scope goals get an AI reformulation offer. Test: P02-AC07 (rules). |

### PRD-03 Today and My path

| Req | Status | Evidence / notes |
| --- | --- | --- |
| P03-F01 | implemented | One primary action; a due review is secondary and bounded to one per six hours. Not exercised with three simultaneous reviews. |
| P03-F02 | implemented | Server drafts with revisions and conflict handling; localStorage retry queue. Test: P03-AC02 (draft persistence and stale revision). Cross-device resume relies on an account; verified through services, not a second browser. |
| P03-F03 | implemented | Milestone outcomes and evidence requirements; Planned visibly distinct with no launch action. |
| P03-F04 | implemented | Path revisions with reason codes listed on My path. Undo of an optional branch is **not built** (optional depth is entered by preview only). |
| P03-F05 | implemented | "I know this" offers a fresh check; preview awards nothing. Test: P03-AC05. |
| P03-F06 | implemented | GOAL_COMPLETE and COVERAGE_LIMIT states on Today; no phantom content. Test: policy path exercised in `tests/practice.test.ts` walk. |

### PRD-04 Lesson player and personal examples

| Req | Status | Evidence / notes |
| --- | --- | --- |
| P04-F01 | implemented | Versioned blocks; answer field does not move while typing (reviewed content renders before any adaptation). |
| P04-F02 | implemented (fixture) / provider-unverified | Bridges use eligible facts by id; scenarios labelled imagined; general fallback. Test: loop test checks the supplier bridge and its fixture label. |
| P04-F03 | provider-unverified | Live adaptation validated for fact ids, warnings and length; failure routes to the reviewed template. Not exercised live. |
| P04-F04 | implemented | Explain differently, hint, go deeper, I know this; assistance recorded separately. Test: P04-AC04. |
| P04-F05 | implemented | "This example doesn't fit me" with lesson-only or all-lessons scope. Test: P04-AC05 (fact correction path). |
| P04-F06 | implemented | Continue without the task marks introduced only. Test: P04-AC06. |
| P04-F07 | partial | Content versions saved on assignments and attempts; a version mismatch is rejected with a reload message. Migration notices for published lesson updates are **not built** (single content version so far). |

### PRD-05 Contextual tutor

| Req | Status | Evidence / notes |
| --- | --- | --- |
| P05-F01 | fixture-only / provider-unverified | Thread scoped per activity; selected sentence passed as context. |
| P05-F02 | implemented | Hint ladder before a worked solution; solution marks the attempt assisted. Test: P05-AC02 (worked answer path). |
| P05-F03 | implemented | Tutor has no write path to evidence; fixture refuses "mark me complete". Test: covered by assessment service design; the injected-instruction case is covered for grading (`tests/content.test.ts`). |
| P05-F04 | provider-unverified | Depth control is prompt-level only. |
| P05-F05 | fixture-only | Fixture declines unverifiable API details; live behaviour unverified. |
| P05-F06 | implemented | Learner message saved first; request key makes retry idempotent; Stop marks incomplete. |
| P05-F07 | implemented | Report creates a content issue with content and prompt version; no reviewer UI. |

### PRD-06 Assessment and evidence

| Req | Status | Evidence / notes |
| --- | --- | --- |
| P06-F01 | implemented | Item, rubric and version references on every attempt; version mismatch rejected. |
| P06-F02 | implemented | `publicItem()` strips keys; e2e asserts keys absent from page HTML. Test: loop test string check. |
| P06-F03 | implemented | Unique (learner, idempotency key); replay returns the same attempt. Test: P06-AC03. |
| P06-F04 | implemented (deterministic) / provider-unverified | Span validation downgrades model criteria whose quoted text is absent. Test: `validateSpans` used in live path only; not exercised live. |
| P06-F05 | implemented | Repeated family and assisted attempts never count as independent; contract needs distinct families plus transfer. Test: P06-AC05. |
| P06-F06 | implemented | Main gap and next move; misconception feedback. Test: P06-AC06. |
| P06-F07 | implemented | Append-only appeal, provisional marker, human resolution recomputes projection. Test: P06-AC07. |
| P06-F08 | implemented (deterministic) | Cue grading ignores grammar; awkward-but-correct cases in every family pass. Test: `tests/content.test.ts`. |

### PRD-07 Adaptive next steps and review

| Req | Status | Evidence / notes |
| --- | --- | --- |
| P07-F01 | implemented | Explicit policy with reason codes, evidence ids and policy version on every assignment and revision; replayable without a model. |
| P07-F02 | implemented | State-version check before committing a proposal; stale proposals rejected. Not exercised concurrently in tests. |
| P07-F03 | implemented | Unknown → PREREQUISITE_CHECK / CHECK_FAMILIARITY; failed → REPAIR_*. Test: P02-AC04, P06-AC06. |
| P07-F04 | implemented | Two distinct failures → REDUCE_SUPPORT with the simpler explanation; goal unchanged. Test: P07-AC04. |
| P07-F05 | implemented | 2/7/21-day schedule; one review per session window; review failure keeps history. Long-absence backlog behaviour **not tested** with many due items. |
| P07-F06 | implemented | Goal change preserves evidence and previews requirements. Test: P07-AC06. |
| P07-F07 | implemented | COVERAGE_LIMIT with a Planned milestone; no invented lesson ids. |

### PRD-08 Practice and simulations

| Req | Status | Evidence / notes |
| --- | --- | --- |
| P08-F01 | partial | Approval-boundary and retrieval-explorer simulations; task-brief editor and evidence comparison exist as worksheet items rather than a workspace. Test: P08-AC01. |
| P08-F02 | implemented | Every trace line is labelled simulated; no network calls. Test: P08-AC02. |
| P08-F03 | implemented | Submission requires a decision explanation. Test: P08-AC03. |
| P08-F04 | implemented | Versioned runs, compare, reset confirmation, fresh scenario after assistance. Test: P08-AC04. |
| P08-F05 | not built (by design) | No code execution; code reading not yet authored (research route planned). |
| P08-F06 | partial | Deterministic simulations cannot time out; infrastructure-failure labelling has no trigger yet. |

### PRD-09 My work

| Req | Status | Evidence / notes |
| --- | --- | --- |
| P09-F01 | implemented | Artefacts carry task, rubric version, feedback and evidence context. |
| P09-F02 | implemented | First-versus-latest comparison with criterion-level improvements and assistance labels. |
| P09-F03 | implemented | Milestone completion, demonstrated capabilities and review due are separate; no percentage anywhere. |
| P09-F04 | implemented | Markdown export with assistance context; no public URL. PDF export **not built**. |
| P09-F05 | implemented | Drafts listed as Draft with Resume. |

### PRD-10 Learner control and privacy

| Req | Status | Evidence / notes |
| --- | --- | --- |
| P10-F01 | implemented | Atomic single-use claim; merge preview with explicit keep/switch. Test: P10-AC01. |
| P10-F02 | implemented | Edit/remove facts; personal examples can be disabled; shares containing a removed fact are flagged. Test: P10-AC02 via P01-AC06 and sharing test. |
| P10-F03 | implemented | Retention sweeper: raw text and objects after 24 h, guests after 7 days. Test: P10-AC03 with an advanced clock. |
| P10-F04 | implemented | Immediate revocation, deletion job across every owned object type, share tokens stop resolving. Backup ageing is a hosting decision, not implemented here. Test: P10-AC04. |
| P10-F05 | implemented | JSON export with readable summaries; both goal versions and resolvable work. Test: P10-AC05. |
| P10-F06 | implemented | Analytics and AI ledger store ids and statuses only. Test: P10-AC06. Role-based reviewer access **not built** (no reviewer interface). |
| P10-F07 | implemented | Reminders default off and are never scheduled (no reminder sender exists). |

### PRD-11 Sharing (R2)

| Req | Status | Evidence / notes |
| --- | --- | --- |
| P11-F01 | implemented | Sharing offered from My work only; dismissible dialog; no contact import. |
| P11-F02 | implemented | Snapshot copies sanitised fields; fact values and proper nouns from facts redacted. Test: P11-AC02. Sanitisation is heuristic and needs review before external use. |
| P11-F03 | implemented | Preview with explicit publish; assisted label and assessment scope text. |
| P11-F04 | implemented | Unguessable tokens (hashed at rest), rate limits, revocation, noindex header. Test: P11-AC04. |
| P11-F05 | implemented | Recipient challenge with feedback and no account. Test: P11-AC05. |
| P11-F06 | partial | Events recorded (share_published, shared_task_attempted); no funnel report. |

### PRD-12 Billing (R3)

Not built, by decision D-scope: no plans, entitlements or payments. Nothing in the product asks for payment.

### PRD-13 Curriculum publishing

| Req | Status | Evidence / notes |
| --- | --- | --- |
| P13-F01 | implemented | Validator rejects missing references and cycles, naming ids. Test: P13-AC01. |
| P13-F02 | implemented | Milestones without a complete evidence path are downgraded to Planned. Test: P13-AC02. |
| P13-F03 | partial | Dated-source fields exist; no review workflow tooling. Content has not had human subject review. |
| P13-F04 | implemented by construction | Runtime models cannot add content; proposals are not captured yet. |
| P13-F05 | partial | Versions stored on attempts; re-evaluation route exists via appeals, not via a content-correction job. |
| P13-F06 | partial | Content issues table and reporting; suspension of a content version **not built**. |

### PRD-14 Accessibility, reliability and operations

| Req | Status | Evidence / notes |
| --- | --- | --- |
| P14-F01 | partial | Semantic controls, visible focus, skip link, status announcements, 390 px layout. Playwright checks a keyboard-only path to the goal screen. **No screen-reader or 200% zoom testing was done.** |
| P14-F02 | implemented | Autosave with revisions, offline retry queue, private local caches cleared on logout. Test: draft tests; offline path not exercised in the browser. |
| P14-F03 | implemented | Owner checks on every object route with an access audit; rate limits on public and expensive routes. Test: ownership tests. Route-level cross-user tests via HTTP **not written**. |
| P14-F04 | implemented (fixture) / provider-unverified | Fixture mode is labelled in the shell, lesson, tutor and feedback; provider failure paths save work and never pass. |
| P14-F05 | partial | AI request ledger with latency, tokens and error classes; jobs table with retries; no alerting. |
| P14-F06 | not built | No deployment, backups or staging in this repository. |
| P14-F07 | not built | No load test; no percentiles reported. |

## Known limitations and risks (severe first)

1. **No live provider session.** Every model path is written but unverified. Until a key is configured and the
   fixture suite in `spec/prompts/RUNTIME_PROMPT_CONTRACTS.md` is run live, personal examples, tutoring and written
   grading should be described as reviewed deterministic fixtures.
2. **Deterministic written grading is cue-based.** It passes the authored evaluation cases but will misgrade answers
   that use different vocabulary. Provisional results and the appeal route exist for this reason; a human review
   queue is needed before a pilot.
3. **Content has not had subject-matter review.** Fourteen lessons and 56 item families were authored to the spec's
   rules and golden lessons; the spec requires qualified review before assessments control progression in a pilot.
4. **Accessibility is designed in but not tested with assistive technology.**
5. **Single-process rate limiting and in-process extraction.** Adequate for a pilot on one instance only.
6. **Sanitisation for sharing is heuristic** (fact values and proper nouns from facts). Review public payloads before
   external use.
7. **No reviewer or operations interface** for appeals, content issues or the AI ledger.

## Validation record

- `npm run typecheck`: clean.
- `npm run lint`: clean (one advisory about the ESLint config export).
- `npm test`: 41 tests across 6 files pass (content evaluation set, extraction and goal rules, learning loop,
  ownership, uploads and retention, accounts and claiming, sharing, simulations).
- `npm run build`: production build succeeds.
- `npm run test:e2e`: 6 Playwright tests pass at 1440 px and 390 px against a production build with the pre-installed
  Chromium: the full first session (arrival → manual context → goal → personalised lesson → wrong answer → targeted
  feedback → repair activity → Today → My path → My work), a keyboard-only path to the goal screen, and the sample lesson
  grading without creating a profile. Screenshots are kept in `docs/screenshots/`.
- Not run: any live model provider call; any screen-reader session; any load test.
