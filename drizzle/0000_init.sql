CREATE TABLE "access_audit" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_learner_id" text,
	"action" text NOT NULL,
	"object_type" text NOT NULL,
	"object_id" text,
	"outcome" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"goal_version_id" text NOT NULL,
	"activity_type" text NOT NULL,
	"milestone_id" text NOT NULL,
	"capability_id" text NOT NULL,
	"lesson_id" text,
	"lesson_version" integer,
	"item_id" text,
	"item_version" integer,
	"item_family" text,
	"practice_id" text,
	"state" text NOT NULL,
	"reason_code" text NOT NULL,
	"reason_text" text NOT NULL,
	"evidence_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"policy_version" text NOT NULL,
	"content_version" text NOT NULL,
	"context_binding" jsonb,
	"resume_pointer" jsonb,
	"exposure_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ai_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text,
	"task_type" text NOT NULL,
	"prompt_version" text NOT NULL,
	"model" text NOT NULL,
	"provider_mode" text NOT NULL,
	"status" text NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"latency_ms" integer,
	"error_class" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text,
	"name" text NOT NULL,
	"props" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"surface" text,
	"release_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appeals" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"attempt_id" text NOT NULL,
	"original_evaluation_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" text NOT NULL,
	"resolution_evaluation_id" text,
	"resolution_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "artefact_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"artefact_key" text NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"kind" text NOT NULL,
	"capability_id" text NOT NULL,
	"milestone_id" text NOT NULL,
	"item_id" text NOT NULL,
	"task_context" text NOT NULL,
	"content" jsonb NOT NULL,
	"attempt_id" text,
	"evaluation_id" text,
	"assisted" boolean DEFAULT false NOT NULL,
	"is_draft" boolean DEFAULT false NOT NULL,
	"content_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assistance_events" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"assignment_id" text NOT NULL,
	"item_id" text,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"assignment_id" text,
	"item_id" text NOT NULL,
	"item_version" integer NOT NULL,
	"rubric_id" text NOT NULL,
	"rubric_version" integer NOT NULL,
	"item_family" text NOT NULL,
	"capability_id" text NOT NULL,
	"depth" text NOT NULL,
	"kind" text NOT NULL,
	"submission" jsonb NOT NULL,
	"assistance" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"assisted" boolean DEFAULT false NOT NULL,
	"confidence" text,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "capability_projections" (
	"learner_id" text NOT NULL,
	"capability_id" text NOT NULL,
	"state" text NOT NULL,
	"depth" text NOT NULL,
	"supporting_evidence_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"passed_families" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"transfer_passed" boolean DEFAULT false NOT NULL,
	"artefact_passed" boolean DEFAULT false NOT NULL,
	"distinct_failures" integer DEFAULT 0 NOT NULL,
	"failed_families" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_independent_at" timestamp with time zone,
	"demonstrated_at" timestamp with time zone,
	"review_due_at" timestamp with time zone,
	"review_stage" integer DEFAULT 0 NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "capability_projections_learner_id_capability_id_pk" PRIMARY KEY("learner_id","capability_id")
);
--> statement-breakpoint
CREATE TABLE "content_issues" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text,
	"content_ref" text NOT NULL,
	"message_id" text,
	"severity" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"assignment_id" text NOT NULL,
	"item_id" text NOT NULL,
	"content" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"content_version" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluations" (
	"id" text PRIMARY KEY NOT NULL,
	"attempt_id" text NOT NULL,
	"learner_id" text NOT NULL,
	"rubric_id" text NOT NULL,
	"rubric_version" integer NOT NULL,
	"evaluator" text NOT NULL,
	"evaluator_version" text NOT NULL,
	"status" text NOT NULL,
	"result" text NOT NULL,
	"criteria" jsonb NOT NULL,
	"summary" text NOT NULL,
	"main_gap" text,
	"next_move" text,
	"uncertainty" text,
	"supersedes_id" text,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_events" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"evaluation_id" text NOT NULL,
	"attempt_id" text NOT NULL,
	"capability_id" text NOT NULL,
	"depth" text NOT NULL,
	"item_family" text NOT NULL,
	"task_kind" text NOT NULL,
	"independent" boolean NOT NULL,
	"result" text NOT NULL,
	"goal_version_id" text,
	"superseded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goal_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"version" integer NOT NULL,
	"original_text" text NOT NULL,
	"interpretation" text NOT NULL,
	"destination" text NOT NULL,
	"target_capability_ids" jsonb NOT NULL,
	"milestone_ids" jsonb NOT NULL,
	"depth" text NOT NULL,
	"coverage" jsonb NOT NULL,
	"provisional" boolean DEFAULT false NOT NULL,
	"clarification" jsonb,
	"interpreter" text NOT NULL,
	"status" text NOT NULL,
	"out_of_scope" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"activated_at" timestamp with time zone,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text,
	"kind" text NOT NULL,
	"status" text NOT NULL,
	"scope" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"progress" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "learners" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"user_id" text,
	"token_hash" text,
	"profile_version" integer DEFAULT 1 NOT NULL,
	"state_version" integer DEFAULT 1 NOT NULL,
	"preferences" jsonb DEFAULT '{"sessionMinutes":20,"personalExamples":true,"exampleDomainOverride":null,"reminders":false}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"claimed_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "manual_contexts" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "path_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"goal_version_id" text NOT NULL,
	"previous_revision_id" text,
	"next_assignment_id" text,
	"reason_code" text NOT NULL,
	"reason_text" text NOT NULL,
	"evidence_snapshot" jsonb NOT NULL,
	"policy_version" text NOT NULL,
	"state_version" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"assignment_id" text,
	"practice_id" text NOT NULL,
	"practice_version" integer NOT NULL,
	"scenario_key" text NOT NULL,
	"configuration" jsonb NOT NULL,
	"trace" jsonb NOT NULL,
	"outcome" jsonb NOT NULL,
	"run_number" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_facts" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"fact_type" text NOT NULL,
	"value" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text,
	"source_span" text,
	"confidence" text DEFAULT 'medium' NOT NULL,
	"confirmed" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"superseded_by" text,
	"profile_version" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "share_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"share_id" text NOT NULL,
	"visitor_key" text NOT NULL,
	"submission" jsonb NOT NULL,
	"result" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "share_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"show_name" boolean DEFAULT false NOT NULL,
	"display_name" text,
	"source_artefact_id" text,
	"flagged_for_review" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tutor_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"learner_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"status" text NOT NULL,
	"assistance_level" text,
	"selection" text,
	"request_key" text,
	"prompt_version" text,
	"provider_mode" text,
	"reported_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutor_threads" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"assignment_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upload_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"status" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"object_key" text,
	"parser_version" text NOT NULL,
	"error_class" text,
	"error_message" text,
	"page_count" integer,
	"extracted_chars" integer,
	"raw_text" text,
	"stages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"raw_expires_at" timestamp with time zone NOT NULL,
	"raw_purged_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "assignments_learner_idx" ON "activity_assignments" USING btree ("learner_id");--> statement-breakpoint
CREATE INDEX "artefacts_learner_idx" ON "artefact_versions" USING btree ("learner_id");--> statement-breakpoint
CREATE INDEX "assistance_learner_idx" ON "assistance_events" USING btree ("learner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attempts_idem_idx" ON "attempts" USING btree ("learner_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "attempts_learner_idx" ON "attempts" USING btree ("learner_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_token_idx" ON "auth_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "drafts_unique_idx" ON "drafts" USING btree ("learner_id","assignment_id","item_id");--> statement-breakpoint
CREATE INDEX "evaluations_attempt_idx" ON "evaluations" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "evidence_learner_idx" ON "evidence_events" USING btree ("learner_id");--> statement-breakpoint
CREATE INDEX "goal_versions_learner_idx" ON "goal_versions" USING btree ("learner_id");--> statement-breakpoint
CREATE INDEX "jobs_learner_idx" ON "jobs" USING btree ("learner_id");--> statement-breakpoint
CREATE INDEX "learners_user_idx" ON "learners" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "learners_token_idx" ON "learners" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "path_revisions_learner_idx" ON "path_revisions" USING btree ("learner_id");--> statement-breakpoint
CREATE INDEX "practice_runs_learner_idx" ON "practice_runs" USING btree ("learner_id");--> statement-breakpoint
CREATE INDEX "profile_facts_learner_idx" ON "profile_facts" USING btree ("learner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "share_token_idx" ON "share_snapshots" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "tutor_messages_thread_idx" ON "tutor_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tutor_threads_unique_idx" ON "tutor_threads" USING btree ("learner_id","assignment_id");--> statement-breakpoint
CREATE INDEX "upload_jobs_learner_idx" ON "upload_jobs" USING btree ("learner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");