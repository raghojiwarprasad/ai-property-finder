# Interface, visual direction and screen contracts

## 1. Overall impression

Design a quiet, intelligent study environment that makes reading, thinking and doing comfortable. The visual hierarchy should be immediately legible: current goal, current idea, relevant example, action. Use restraint in navigation and generous space around the task. The product should have a recognisable visual identity without making AI look mysterious.

The reference images in `design/` show composition and representative content. They are static design references, not screenshots of an implemented product. Final implementation must meet the behaviour and accessibility requirements here, including states not pictured.

## 2. Visual tokens

| Token | Specification |
| --- | --- |
| Canvas | Warm off-white `#F7F7F2` |
| Surface | White `#FFFFFF`; muted section `#EEF2EE` |
| Main text | Charcoal `#172A25` |
| Secondary text | `#52615C`; never use placeholder grey for essential instructions |
| Primary action | Deep green `#175C48`, white text |
| Link / focus | `#164FC7`; visible focus outline at least 2 px with 2 px offset |
| Borders | `#D9E1DA`; supplement with grouping and labels |
| Error / caution | Error `#A32D2D`; caution text `#79520C` on pale surface |
| Body type | Inter when available; system sans-serif fallback; 18 px lesson prose, 16 px controls |
| Headings | 40/48 px page title, 28/36 px section, 20/28 px subsection |
| Reading measure | Target 60–75 characters per line; lesson column max 720 px |
| Spacing | 4, 8, 12, 16, 24, 32, 48 and 64 px |
| Corners | 12 px standard panel; 8 px field; 999 px chips only |
| Interaction targets | Product target 44 x 44 px or larger; evaluate WCAG exceptions separately |
| Motion | 120–200 ms focus/expand transitions; honour reduced motion; no simulated typing delay |

These are initial design decisions, not validated accessibility results. Test the actual combinations, focus treatment and layouts in the finished UI. Product accessibility target: WCAG 2.2 AA. See S02 in `SOURCES_AND_ASSUMPTIONS.md`.

## 3. Layout and navigation

At 1280 px and above, use a 216 px left navigation rail, a flexible primary column and an optional 320 px tutor panel. The tutor panel opens only when useful; it must not permanently compress the reading area. At 768–1279 px, use a compact top navigation and a tutor overlay or stacked panel. Below 768 px, use bottom navigation with Today, My path and My work, and a full-height tutor sheet that restores the previous scroll position on close.

Design at 390 px mobile, 768 px tablet and 1440 px desktop. No essential content requires hover. Code and wide data outputs may scroll horizontally within a labelled region, never force the whole page sideways. A mobile learner can complete every non-code task; complex coding work offers save-and-continue-on-desktop without discarding the learning session.

The top utility area contains current goal, account/profile access and help. Do not expose prompts, model selection, token budgets, databases, agent routing or inferred graph nodes in the learning interface. “Why this next?” explains the educational reason in plain language.

## 4. Screen S01: arrival

Purpose: communicate the promise and make starting obvious. Above the fold: product label, headline, one supporting sentence, primary CTA and a small illustrative example of a personalised explanation. The example says “Example learner”, not a fictional testimonial. Below the fold: three concise stages and representative outcomes for use, lead, build and study. No social proof unless it is real and approved.

Primary CTA opens S02. Secondary CTA opens a labelled sample lesson. Login is a utility link. Loading state preserves the headline and CTA region. Offline state offers a retry with a specific message. Do not replace the page with a generic full-screen spinner.

## 5. Screen S02: experience input

Purpose: collect the minimum context that can improve teaching. Content hierarchy: step label “1 of 2”; “Bring your experience”; upload zone; file types and limit; “Tell us instead”; concise data use note. After selection, show filename, size, remove control and real processing state. Use an ordinary file input for keyboard and screen-reader access even if the dropzone is visually custom.

Error states: unsupported file, excessive size, encrypted PDF, empty extraction, scan requiring OCR, suspicious content, network interruption and expired guest session. Each state offers a specific recovery. A scan may use approved OCR if available; otherwise request pasted text or another file. Never treat missing extracted text as permission to generate a biography.

Success leads to S03 with a small, editable context summary. Keep full CV details out of the screen unless the learner expands them.

## 6. Screen S03: goal and start

Purpose: collect the destination and launch learning. Primary question: “What do you want to do with AI?” Use five suggestion chips and a free-text field. Choosing a chip writes editable text rather than silently assigning a permanent profession-based route.

Show one proposed first milestone, two context facts and the optional session-length control. The CTA reads “Start my first lesson”. For a research goal, the milestone card says “Your destination includes research. We'll begin with the foundations you need.” Planned advanced content must be visibly identified in the expanded path.

If a goal is outside AI, explain the subject boundary and offer an AI-related interpretation. If the learner wants an unavailable specialist topic, preserve their goal, offer relevant published prerequisites and show the content gap. Do not fabricate coverage.

## 7. Screen S04: first lesson / lesson player

Purpose: make an idea understandable and usable. Top row: back control, milestone label and saved status. Main column: outcome heading, personal bridge, concise explanation, one diagram or worked example if helpful, and the current interaction. Avoid showing the entire lesson transcript as an unstructured chat.

Persistent help actions: “Explain differently”, “Give me a hint”, “Go deeper”, “I know this”. They operate on the current block. “Explain differently” offers simpler wording, another example or a diagram where available; it does not assume a fixed learning style. “I know this” offers an independent check.

Questions show an explicit submit button, editable input and clear result state. Do not mark answers while the user is typing unless they requested coaching. Feedback appears next to the task with criterion-level explanation. A collapsed tutor opens in context and can reference the selected paragraph or attempt.

## 8. Screen S05: task and feedback

Purpose: reveal the learner's reasoning and provide actionable feedback. The task must include the objective, supplied information, allowed actions and success criteria at the appropriate level. Do not expose hidden answer keys or private test cases in browser payloads.

Submission state distinguishes saving, evaluating, reviewed and needs-review. If the evaluator is unavailable, save the attempt and show “Your work is saved; feedback is still being prepared.” Do not award a pass to keep the animation moving. Repeated submission with the same idempotency key returns the same attempt result.

Feedback hierarchy: result in ordinary language; what was supported by the answer; the main gap; one next move. The user can inspect detailed criteria, request a hint, revise or challenge the grade. Show assisted status in the work record, not as a shame badge in the lesson.

## 9. Screen S06: Today

Purpose: make returning effortless. The hero contains the next capability, why now, estimated activity duration and Continue. Add a small review item only if due, followed by one concrete recent achievement and a My work link. The primary action should remain clear even if the learner has dozens of completed tasks.

Variants: new learner opens their first lesson; active learner resumes a draft; returning learner gets a small check; milestone-complete learner sees the next milestone; no published next content shows an honest completion state plus available practice and a content-update preference. Never generate phantom content cards.

## 10. Screen S07: My path

Purpose: orient the learner without making them manage a knowledge graph. Show goal, editable session preference, current milestone and a vertical list of upcoming milestone outcomes. Each milestone includes availability, evidence requirement and prerequisites in an expandable section. Use plain status labels: Ready, In progress, Demonstrated, Review due, Planned.

The learner can inspect “Why this is here”, preview an activity, take a prerequisite check, change the goal or undo the latest optional branch. Goal changes show a before/after summary and preserve a recoverable path revision. Available content must not look visually identical to planned content.

## 11. Screen S08: practice workspace

Purpose: let the learner make consequential choices in a safe educational environment. Layout: brief, editable working area, run/submit control, result and optional coaching. The working area may be a prompt editor, decision worksheet, retrieval explorer, constrained workflow simulation or later a sandboxed code exercise.

For a simulation, label “Simulation” beside the title and describe what is simulated. Tool permission choices produce observable outcomes; a button animation alone is insufficient. Preserve versions so the learner can compare their initial and improved work. A reset must ask before discarding unsaved changes.

## 12. Screen S09: My work and item detail

Purpose: make learning progress tangible. List work by milestone or recency. Each item shows title, capability, most recent revision and feedback status. Item detail contains the task, work, feedback, support history and comparison between versions. The learner can export or share a sanitised snapshot through a deliberate preview.

Do not show a certificate implying professional qualification. A completion record can accurately state the reviewed task and conditions. Sharing does not automatically make the user's profile discoverable.

## 13. Screen S10: profile, memory and settings

Purpose: give control over context and preferences. Separate “Experience I use for examples” from “What your work has demonstrated”. Profile facts have source labels and edit/remove controls. A learner can disable personal context entirely, use a different example domain, change session length, manage reminders, export records or delete their account.

Removing an experience fact invalidates future personalisation that depends on it. It does not silently delete the learner's completed work. Deletion controls explain their scope and timeline before the irreversible action.

## 14. Screen S11: sharing preview and recipient

Purpose: share useful learning without exposing personal history. The preview shows exactly what will be public, including task context, selected output and any assistance label. Default employer names and personal facts to excluded. The recipient can try a short challenge immediately, then optionally start their own learning path.

A revoked link displays a neutral unavailable state. Do not reveal the creator's identity or reason for revocation. Shared pages should not be indexed by default in the first release.

## 15. Global states and interaction quality

Every screen must specify empty, loading, error, offline, permission-denied and success states when applicable. Preserve input on recoverable failures. Announce saved state and evaluation results accessibly without repeatedly moving focus. Dialogues trap focus appropriately and restore it on close. Support browser back/forward and deep links after authentication.

Use skeletons only for content with a known layout. Do not use a spinner to hide an indefinite model operation. Every long operation has cancellation, retry and a recoverable saved state. Accessible interaction and data correctness are release requirements, not post-polish tasks.
