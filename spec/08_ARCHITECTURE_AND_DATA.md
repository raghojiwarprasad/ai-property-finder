# System architecture and data contracts

## Architecture decision

Start with a modular application, a relational database, private object storage and a small background-job worker. Keep one product repository and clear internal service boundaries. Do not introduce a network of autonomous agents or a graph database merely because the product reasons about prerequisites. The capability graph can initially be represented as versioned nodes and edges in relational tables or validated content files.

For a fresh build, a TypeScript web application with a server API is a reasonable default; use a separate bounded parsing worker if document tooling requires it. PostgreSQL is the proposed persistent store. These are implementation defaults, not mandatory vendors. Inspect the existing ZIP before deciding whether any component is worth reusing. Keep the old product as reference and implement the new experience against these contracts. Verify current dependency versions and provider documentation at implementation time.

## Service responsibilities

- Web client: accessible screens, local draft buffering, rendering reviewed lesson blocks, task interaction and explicit learner controls. It cannot grade work, grant capabilities or authorise object access.
- Session/API layer: authenticated and guest identity, ownership checks, quotas, schema validation, idempotency and transaction boundaries.
- Experience service: bounded upload/extraction, source-backed facts, corrections and permitted example context. It does not grant skill evidence.
- Curriculum service: published capabilities, prerequisites, lesson templates, item families, rubrics and coverage metadata.
- Learning service: activity assignment, saved state, evidence projection, review schedule and path revisions under a versioned policy.
- Assessment service: immutable attempts, deterministic checks, constrained written evaluation, appeal and evidence events.
- Model gateway: provider abstraction, explicit task type, prompt version, permitted context, structured output validation, cancellation, cost ledger and redacted diagnostics.
- Practice service: deterministic simulations first; separately isolated execution only after the sandbox release gate.
- Background worker: parsing, expensive evaluation, exports, deletion and retryable maintenance jobs. Jobs use stable IDs and bounded retries.

## Entity contracts

All learner-owned records include owner identity and timestamps. User identity is resolved on the server. IDs supplied by a browser never confer access.

| Entity | Important fields and invariants |
| --- | --- |
| User / GuestSession | Opaque ID, ownership type, expiry, preferences; guest claim is single-use and atomic |
| UploadJob | Owner, status, private object key, parser version, error class, expiry; no public file URL |
| ProfileFact | ID, fact type, value, source span, source ID, confirmation, active flag; contact details excluded from teaching context |
| ExperienceEvent | Related fact IDs, role/project/action/tool/constraint links; unknown fields remain null |
| GoalVersion | Original text, interpretation, target capability IDs, depth, coverage, session preference; one active primary goal |
| CapabilityVersion | ID, definition, depth dimensions, prerequisites, evidence contract, status; validated references |
| LessonVersion | Capability, canonical explanation, adaptation slots, sources, misconceptions, task IDs; immutable published version |
| ActivityAssignment | Owner, goal version, lesson/task versions, state, recommendation reason and resume pointer |
| Attempt | Owner, item version, submitted work, assistance events, item family and idempotency key; immutable submission |
| Evaluation | Attempt ID, rubric version, criterion results, supporting answer spans, evaluator version, final/provisional status |
| EvidenceEvent | Evaluation ID, capability/depth, independent or assisted status, timestamp and supersession reference |
| CapabilityProjection | Derived state, supporting evidence IDs, last independent check and review state; rebuildable from events |
| PathRevision | Goal version, previous revision, next activity, reason code, evidence snapshot and policy version |
| ArtefactVersion | Work, task context, assistance, feedback links, content version and owner |
| ShareSnapshot | Sanitised copied content, explicit publication, token hash, revocation state; no live private-record references |
| Export / DeletionJob | Owner, requested scope, progress, retries and completion evidence |

## Core API surface

These are proposed application endpoints, not an existing API or vendor SDK. Document request and response schemas before implementation. All writes require CSRF/origin protection appropriate to the chosen authentication mechanism.

| Method and path | Contract |
| --- | --- |
| POST /api/guest-sessions | Create bounded guest session; secure cookie, no chosen user ID |
| POST /api/uploads | Validate file and create owned ingestion job; return job ID |
| GET /api/uploads/:id/status | Return owned job status and supported recovery choices |
| POST /api/experience | Save manual context or accepted extracted facts |
| PATCH /api/profile/facts/:id | Correct/remove owned fact with profile version precondition |
| POST /api/goals | Interpret goal; return coverage and proposed first milestone |
| POST /api/goals/:id/activate | Activate interpreted goal and first activity idempotently |
| GET /api/today | Return current activity, due review and saved state |
| GET /api/path | Return milestone outcomes, availability and evidence summaries |
| GET /api/activities/:id | Return task/lesson content excluding hidden answers |
| PUT /api/activities/:id/draft | Save draft with client revision and conflict handling |
| POST /api/attempts | Persist immutable attempt; return saved/evaluation state |
| GET /api/attempts/:id | Return owned work and permitted feedback |
| POST /api/attempts/:id/appeal | Create review request; do not mutate original grade |
| POST /api/tutor/messages | Save contextual message and stream or queue response |
| POST /api/practice/runs | Run a permitted simulation template with bounded inputs |
| GET /api/work | List owned artefacts and their evidence context |
| POST /api/account/claim-guest | Atomic authenticated ownership transfer with merge policy |
| POST /api/exports | Queue owned-data export |
| DELETE /api/account | Revoke access and queue complete deletion |
| POST /api/shares | R2: publish explicit sanitised snapshot |
| DELETE /api/shares/:id | R2: revoke owned snapshot and associated access |

## Assessment transaction

Validate identity and task version; save attempt once; reserve evaluator work; evaluate against the correct rubric; validate the result; append evaluation and evidence; update the capability projection; propose a next activity. Commit evidence/projection consistently. A delayed model call must not hold a database transaction open. On job completion, check the current attempt, goal and learner-state versions before applying derived changes.

An idempotency key is unique within owner and operation scope. Replaying a submission returns the existing attempt. Re-evaluation creates a new evaluation record linked to the original; it does not create another independent task. Distinct item families and assistance status are checked by server logic, not trusted from client fields.

## Model boundaries

The model receives a minimal context packet, never the entire database. CV extraction, goal interpretation, lesson adaptation, tutoring and written grading are separate task types with separate schemas and permissions. A model can propose content and assessments; it cannot directly run SQL, mutate mastery, send messages, publish shares or execute arbitrary code.

Treat CVs, learner text, retrieved material and model responses as untrusted. Prompt wording is only one control. Apply ownership checks, tool allowlists, schema validation, source-reference checks and independent deterministic policy enforcement. See S03 for the general prompt-injection threat; the architecture choices here are product-specific controls, not a guarantee that prompt injection is solved.

## Performance and cost controls

Generate the first useful activity before the full path. Cache reviewed canonical material globally, but scope personalised caches to owner, goal version and profile version. Do not share personal prompt outputs across users. Invalidate dependent caches after a fact correction or deletion.

Use task-specific model budgets, bounded context length, cancellation, request deduplication and at most one automatic retry for a transient failure where safe. Store actual provider usage and latency per task type. Do not silently switch a failed evaluator to a permissive grader. Provider limits and product quotas must be visible where they affect learner actions.

## Operations and release limits

Separate development fixtures, staging and production. Keep keys server-side, store files privately, restrict parser resources and implement a retention sweeper. Test restore and deletion across database, objects, queues, logs and personalised caches. Add contract tests for cross-user access, stale results, repeated submissions and invalid model output before inviting learners.

No live code execution, external action integrations or billing is needed for the first complete learning loop. The teaching, evidence and adaptation paths must operate with reviewed content even when a provider is unavailable, while clearly labelling the reduced personalisation or pending feedback.
