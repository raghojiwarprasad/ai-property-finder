import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/**
 * Persistence contracts for the learning product. See spec/08_ARCHITECTURE_AND_DATA.md.
 *
 * Every learner-owned record carries `learnerId`. A learner is either a guest session
 * or an account-bound record; the identity is always resolved on the server from a
 * signed cookie. IDs supplied by the browser never confer access.
 */

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
  deletedAt: ts("deleted_at"),
}, (t) => [uniqueIndex("users_email_idx").on(t.email)]);

export const learners = pgTable("learners", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(), // guest | account
  userId: text("user_id"),
  tokenHash: text("token_hash"), // guest cookie token hash (null after claim)
  profileVersion: integer("profile_version").notNull().default(1),
  stateVersion: integer("state_version").notNull().default(1),
  preferences: jsonb("preferences").notNull().$type<LearnerPreferences>().default({
    sessionMinutes: 20,
    personalExamples: true,
    exampleDomainOverride: null,
    reminders: false,
  }),
  createdAt: ts("created_at").notNull().defaultNow(),
  lastSeenAt: ts("last_seen_at").notNull().defaultNow(),
  expiresAt: ts("expires_at"), // guests only
  claimedAt: ts("claimed_at"),
  archivedAt: ts("archived_at"),
  deletedAt: ts("deleted_at"),
}, (t) => [index("learners_user_idx").on(t.userId), index("learners_token_idx").on(t.tokenHash)]);

export type LearnerPreferences = {
  sessionMinutes: 10 | 20 | 40;
  personalExamples: boolean;
  exampleDomainOverride: string | null;
  reminders: boolean;
};

export const authSessions = pgTable("auth_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
  expiresAt: ts("expires_at").notNull(),
  revokedAt: ts("revoked_at"),
}, (t) => [index("auth_sessions_token_idx").on(t.tokenHash)]);

export const uploadJobs = pgTable("upload_jobs", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull(),
  status: text("status").notNull(), // validating | extracting | ready | cancelled | failed | expired
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  objectKey: text("object_key"), // private path; never a public URL
  parserVersion: text("parser_version").notNull(),
  errorClass: text("error_class"),
  errorMessage: text("error_message"),
  pageCount: integer("page_count"),
  extractedChars: integer("extracted_chars"),
  rawText: text("raw_text"), // removed by the retention sweeper
  stages: jsonb("stages").notNull().$type<Array<{ stage: string; at: string }>>().default([]),
  createdAt: ts("created_at").notNull().defaultNow(),
  completedAt: ts("completed_at"),
  cancelledAt: ts("cancelled_at"),
  rawExpiresAt: ts("raw_expires_at").notNull(),
  rawPurgedAt: ts("raw_purged_at"),
}, (t) => [index("upload_jobs_learner_idx").on(t.learnerId)]);

export const profileFacts = pgTable("profile_facts", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull(),
  factType: text("fact_type").notNull(), // role | action | project | tool | constraint | domain | education | outcome
  value: text("value").notNull(),
  sourceType: text("source_type").notNull(), // cv | manual | user_edit
  sourceId: text("source_id"), // upload job id or manual submission id
  sourceSpan: text("source_span"),
  confidence: text("confidence").notNull().default("medium"), // low | medium | high
  confirmed: boolean("confirmed").notNull().default(false),
  active: boolean("active").notNull().default(true),
  supersededBy: text("superseded_by"),
  profileVersion: integer("profile_version").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
  removedAt: ts("removed_at"),
}, (t) => [index("profile_facts_learner_idx").on(t.learnerId)]);

export const manualContexts = pgTable("manual_contexts", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull(),
  text: text("text").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const goalVersions = pgTable("goal_versions", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull(),
  version: integer("version").notNull(),
  originalText: text("original_text").notNull(),
  interpretation: text("interpretation").notNull(),
  destination: text("destination").notNull(), // use | lead | marketing | build | research | foundations
  targetCapabilityIds: jsonb("target_capability_ids").notNull().$type<string[]>(),
  milestoneIds: jsonb("milestone_ids").notNull().$type<string[]>(),
  depth: text("depth").notNull(),
  coverage: jsonb("coverage").notNull().$type<GoalCoverage>(),
  provisional: boolean("provisional").notNull().default(false),
  clarification: jsonb("clarification").$type<{ question: string; options: string[] } | null>(),
  interpreter: text("interpreter").notNull(), // rules | model | fixture
  status: text("status").notNull(), // draft | active | archived
  outOfScope: boolean("out_of_scope").notNull().default(false),
  createdAt: ts("created_at").notNull().defaultNow(),
  activatedAt: ts("activated_at"),
  archivedAt: ts("archived_at"),
}, (t) => [index("goal_versions_learner_idx").on(t.learnerId)]);

export type GoalCoverage = {
  published: string[];
  planned: string[];
  unsupported: string[];
  gapNote: string | null;
};

export const activityAssignments = pgTable("activity_assignments", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull(),
  goalVersionId: text("goal_version_id").notNull(),
  activityType: text("activity_type").notNull(), // lesson | check | transfer | review | practice
  milestoneId: text("milestone_id").notNull(),
  capabilityId: text("capability_id").notNull(),
  lessonId: text("lesson_id"),
  lessonVersion: integer("lesson_version"),
  itemId: text("item_id"),
  itemVersion: integer("item_version"),
  itemFamily: text("item_family"),
  practiceId: text("practice_id"),
  state: text("state").notNull(), // assigned | in_progress | completed | superseded
  reasonCode: text("reason_code").notNull(),
  reasonText: text("reason_text").notNull(),
  evidenceIds: jsonb("evidence_ids").notNull().$type<string[]>().default([]),
  policyVersion: text("policy_version").notNull(),
  contentVersion: text("content_version").notNull(),
  contextBinding: jsonb("context_binding").$type<ContextBinding | null>(),
  resumePointer: jsonb("resume_pointer").$type<{ block: string } | null>(),
  exposureCompletedAt: ts("exposure_completed_at"),
  createdAt: ts("created_at").notNull().defaultNow(),
  startedAt: ts("started_at"),
  completedAt: ts("completed_at"),
}, (t) => [index("assignments_learner_idx").on(t.learnerId)]);

export type ContextBinding = {
  mode: "personal" | "general";
  factIds: string[];
  domainKey: string; // e.g. supplier_comparison | general
  label: string; // "Real experience" | "Imagined scenario"
  source: "fixture" | "live" | "template";
  promptVersion: string | null;
  profileVersion: number;
  blocks: Array<{ kind: "bridge" | "note"; text: string }> | null;
  invalidatedAt: string | null;
};

export const drafts = pgTable("drafts", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull(),
  assignmentId: text("assignment_id").notNull(),
  itemId: text("item_id").notNull(),
  content: jsonb("content").notNull().$type<Record<string, unknown>>(),
  revision: integer("revision").notNull().default(1),
  contentVersion: text("content_version").notNull(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("drafts_unique_idx").on(t.learnerId, t.assignmentId, t.itemId)]);

export const attempts = pgTable("attempts", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull(),
  assignmentId: text("assignment_id"),
  itemId: text("item_id").notNull(),
  itemVersion: integer("item_version").notNull(),
  rubricId: text("rubric_id").notNull(),
  rubricVersion: integer("rubric_version").notNull(),
  itemFamily: text("item_family").notNull(),
  capabilityId: text("capability_id").notNull(),
  depth: text("depth").notNull(),
  kind: text("kind").notNull(), // selected | written | worksheet | simulation
  submission: jsonb("submission").notNull().$type<Record<string, unknown>>(),
  assistance: jsonb("assistance").notNull().$type<string[]>().default([]),
  assisted: boolean("assisted").notNull().default(false),
  confidence: text("confidence"), // sure | unsure | null
  idempotencyKey: text("idempotency_key").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("attempts_idem_idx").on(t.learnerId, t.idempotencyKey),
  index("attempts_learner_idx").on(t.learnerId),
]);

export const evaluations = pgTable("evaluations", {
  id: text("id").primaryKey(),
  attemptId: text("attempt_id").notNull(),
  learnerId: text("learner_id").notNull(),
  rubricId: text("rubric_id").notNull(),
  rubricVersion: integer("rubric_version").notNull(),
  evaluator: text("evaluator").notNull(), // deterministic | model | fixture | human
  evaluatorVersion: text("evaluator_version").notNull(),
  status: text("status").notNull(), // final | provisional | failed
  result: text("result").notNull(), // pass | fail | pending
  criteria: jsonb("criteria").notNull().$type<CriterionResult[]>(),
  summary: text("summary").notNull(),
  mainGap: text("main_gap"),
  nextMove: text("next_move"),
  uncertainty: text("uncertainty"),
  supersedesId: text("supersedes_id"),
  reason: text("reason"), // appeal | re-evaluation | content correction
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [index("evaluations_attempt_idx").on(t.attemptId)]);

export type CriterionResult = {
  id: string;
  label: string;
  critical: boolean;
  status: "met" | "not_met" | "uncertain";
  span: string | null;
  note: string | null;
};

export const evidenceEvents = pgTable("evidence_events", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull(),
  evaluationId: text("evaluation_id").notNull(),
  attemptId: text("attempt_id").notNull(),
  capabilityId: text("capability_id").notNull(),
  depth: text("depth").notNull(),
  itemFamily: text("item_family").notNull(),
  taskKind: text("task_kind").notNull(), // check | transfer | explain | artefact | simulation | review
  independent: boolean("independent").notNull(),
  result: text("result").notNull(), // pass | fail
  goalVersionId: text("goal_version_id"),
  supersededBy: text("superseded_by"),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [index("evidence_learner_idx").on(t.learnerId)]);

export const capabilityProjections = pgTable("capability_projections", {
  learnerId: text("learner_id").notNull(),
  capabilityId: text("capability_id").notNull(),
  state: text("state").notNull(), // unknown | introduced | practising | demonstrated | needs_review
  depth: text("depth").notNull(),
  supportingEvidenceIds: jsonb("supporting_evidence_ids").notNull().$type<string[]>().default([]),
  passedFamilies: jsonb("passed_families").notNull().$type<string[]>().default([]),
  transferPassed: boolean("transfer_passed").notNull().default(false),
  artefactPassed: boolean("artefact_passed").notNull().default(false),
  distinctFailures: integer("distinct_failures").notNull().default(0),
  failedFamilies: jsonb("failed_families").notNull().$type<string[]>().default([]),
  lastIndependentAt: ts("last_independent_at"),
  demonstratedAt: ts("demonstrated_at"),
  reviewDueAt: ts("review_due_at"),
  reviewStage: integer("review_stage").notNull().default(0),
  reason: text("reason").notNull().default(""),
  updatedAt: ts("updated_at").notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.learnerId, t.capabilityId] })]);

export const pathRevisions = pgTable("path_revisions", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull(),
  goalVersionId: text("goal_version_id").notNull(),
  previousRevisionId: text("previous_revision_id"),
  nextAssignmentId: text("next_assignment_id"),
  reasonCode: text("reason_code").notNull(),
  reasonText: text("reason_text").notNull(),
  evidenceSnapshot: jsonb("evidence_snapshot").notNull().$type<Record<string, unknown>>(),
  policyVersion: text("policy_version").notNull(),
  stateVersion: integer("state_version").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [index("path_revisions_learner_idx").on(t.learnerId)]);

export const assistanceEvents = pgTable("assistance_events", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull(),
  assignmentId: text("assignment_id").notNull(),
  itemId: text("item_id"),
  kind: text("kind").notNull(), // hint_1 | hint_2 | worked_answer | explain_differently | tutor_hint | tutor_solution | go_deeper
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [index("assistance_learner_idx").on(t.learnerId)]);

export const artefactVersions = pgTable("artefact_versions", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull(),
  artefactKey: text("artefact_key").notNull(), // groups versions of the same piece of work
  version: integer("version").notNull(),
  title: text("title").notNull(),
  kind: text("kind").notNull(), // written | brief | worksheet | simulation | selected
  capabilityId: text("capability_id").notNull(),
  milestoneId: text("milestone_id").notNull(),
  itemId: text("item_id").notNull(),
  taskContext: text("task_context").notNull(),
  content: jsonb("content").notNull().$type<Record<string, unknown>>(),
  attemptId: text("attempt_id"),
  evaluationId: text("evaluation_id"),
  assisted: boolean("assisted").notNull().default(false),
  isDraft: boolean("is_draft").notNull().default(false),
  contentVersion: text("content_version").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [index("artefacts_learner_idx").on(t.learnerId)]);

export const tutorThreads = pgTable("tutor_threads", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull(),
  assignmentId: text("assignment_id").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("tutor_threads_unique_idx").on(t.learnerId, t.assignmentId)]);

export const tutorMessages = pgTable("tutor_messages", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull(),
  learnerId: text("learner_id").notNull(),
  role: text("role").notNull(), // learner | tutor
  content: text("content").notNull(),
  status: text("status").notNull(), // complete | incomplete | failed | pending
  assistanceLevel: text("assistance_level"), // none | hint | worked_solution
  selection: text("selection"),
  requestKey: text("request_key"),
  promptVersion: text("prompt_version"),
  providerMode: text("provider_mode"), // live | fixture
  reportedAt: ts("reported_at"),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [index("tutor_messages_thread_idx").on(t.threadId)]);

export const appeals = pgTable("appeals", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull(),
  attemptId: text("attempt_id").notNull(),
  originalEvaluationId: text("original_evaluation_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull(), // open | accepted | rejected
  resolutionEvaluationId: text("resolution_evaluation_id"),
  resolutionNote: text("resolution_note"),
  createdAt: ts("created_at").notNull().defaultNow(),
  resolvedAt: ts("resolved_at"),
});

export const practiceRuns = pgTable("practice_runs", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull(),
  assignmentId: text("assignment_id"),
  practiceId: text("practice_id").notNull(),
  practiceVersion: integer("practice_version").notNull(),
  scenarioKey: text("scenario_key").notNull(),
  configuration: jsonb("configuration").notNull().$type<Record<string, unknown>>(),
  trace: jsonb("trace").notNull().$type<Array<Record<string, unknown>>>(),
  outcome: jsonb("outcome").notNull().$type<Record<string, unknown>>(),
  runNumber: integer("run_number").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [index("practice_runs_learner_idx").on(t.learnerId)]);

export const shareSnapshots = pgTable("share_snapshots", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  kind: text("kind").notNull(), // challenge | work
  payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
  showName: boolean("show_name").notNull().default(false),
  displayName: text("display_name"),
  sourceArtefactId: text("source_artefact_id"),
  flaggedForReview: boolean("flagged_for_review").notNull().default(false),
  publishedAt: ts("published_at").notNull().defaultNow(),
  revokedAt: ts("revoked_at"),
}, (t) => [uniqueIndex("share_token_idx").on(t.tokenHash)]);

export const shareAttempts = pgTable("share_attempts", {
  id: text("id").primaryKey(),
  shareId: text("share_id").notNull(),
  visitorKey: text("visitor_key").notNull(),
  submission: jsonb("submission").notNull().$type<Record<string, unknown>>(),
  result: text("result").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id"),
  kind: text("kind").notNull(), // export | deletion | retention_sweep | evaluation
  status: text("status").notNull(), // queued | running | completed | failed
  scope: jsonb("scope").notNull().$type<Record<string, unknown>>().default({}),
  progress: jsonb("progress").notNull().$type<Record<string, unknown>>().default({}),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  result: jsonb("result").$type<Record<string, unknown> | null>(),
  createdAt: ts("created_at").notNull().defaultNow(),
  completedAt: ts("completed_at"),
}, (t) => [index("jobs_learner_idx").on(t.learnerId)]);

export const aiRequests = pgTable("ai_requests", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id"),
  taskType: text("task_type").notNull(),
  promptVersion: text("prompt_version").notNull(),
  model: text("model").notNull(),
  providerMode: text("provider_mode").notNull(), // live | fixture
  status: text("status").notNull(), // ok | invalid_output | timeout | error | refusal | cancelled
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  latencyMs: integer("latency_ms"),
  errorClass: text("error_class"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const contentIssues = pgTable("content_issues", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id"),
  contentRef: text("content_ref").notNull(),
  messageId: text("message_id"),
  severity: text("severity").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id"),
  name: text("name").notNull(),
  props: jsonb("props").notNull().$type<Record<string, string | number | boolean | null>>().default({}),
  surface: text("surface"),
  releaseVersion: text("release_version").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const accessAudit = pgTable("access_audit", {
  id: text("id").primaryKey(),
  actorLearnerId: text("actor_learner_id"),
  action: text("action").notNull(),
  objectType: text("object_type").notNull(),
  objectId: text("object_id"),
  outcome: text("outcome").notNull(), // allowed | denied
  createdAt: ts("created_at").notNull().defaultNow(),
});
