import { z } from "zod";

/**
 * Content contracts. See spec/05_CURRICULUM_AND_CONTENT_SYSTEM.md and PRD-13.
 *
 * Everything under `content/` is reviewed, versioned authored material. Answer keys,
 * expected reasoning and evaluation cases live in `ItemFamily.key`, which is only ever
 * read by server code. `publicItem()` strips it before anything reaches a browser.
 */

export const Depth = z.enum(["explain", "apply", "analyse", "build", "investigate"]);
export type Depth = z.infer<typeof Depth>;

export const Destination = z.enum(["use", "lead", "marketing", "build", "research", "foundations"]);
export type Destination = z.infer<typeof Destination>;

export const CapabilitySchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  title: z.string(),
  outcome: z.string(),
  depths: z.array(Depth).min(1),
  prerequisites: z.array(z.string()),
  kind: z.enum(["conceptual", "applied"]),
  status: z.enum(["published", "draft", "retired"]),
  evidenceContract: z
    .object({
      requiredFamilies: z.number().int().min(1).default(2),
      requireTransfer: z.boolean().default(true),
      requireArtefact: z.boolean().default(false),
    })
    .default({ requiredFamilies: 2, requireTransfer: true, requireArtefact: false }),
});
export type Capability = z.infer<typeof CapabilitySchema>;

export const MilestoneSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  bundle: z.string(), // A | B | C | D | E | R (research route) | X (foundations)
  title: z.string(),
  outcome: z.string(),
  evidenceRequirement: z.string(),
  capabilityIds: z.array(z.string()).min(1),
  destinations: z.array(Destination).min(1),
  order: z.number().int(),
  status: z.enum(["published", "planned"]),
  whyIncluded: z.string(),
  outputDescription: z.string(),
  optional: z.boolean().default(false),
  estimatedSessions: z.string().optional(),
});
export type Milestone = z.infer<typeof MilestoneSchema>;

/** Context families that a bridge can be written for. `general` must always exist. */
export const ContextDomain = z.enum([
  "general",
  "supplier_comparison",
  "operations",
  "leadership",
  "marketing",
  "software",
  "research",
  "community",
]);
export type ContextDomain = z.infer<typeof ContextDomain>;

export const BridgeSchema = z.object({
  domain: ContextDomain,
  /** Fact types that make this bridge eligible. Empty = general. */
  requiresFactTypes: z.array(z.string()).default([]),
  /** Keywords in a learner's facts that select this bridge. */
  keywords: z.array(z.string()).default([]),
  text: z.string(),
  scenarioLabel: z.enum(["real_experience", "imagined"]),
  analogyLimit: z.string().nullable().default(null),
});
export type Bridge = z.infer<typeof BridgeSchema>;

export const LessonBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("orientation"), id: z.string(), text: z.string() }),
  z.object({ type: z.literal("concept"), id: z.string(), heading: z.string().optional(), text: z.string() }),
  z.object({
    type: z.literal("example"),
    id: z.string(),
    heading: z.string(),
    text: z.string(),
    sources: z.array(z.object({ label: z.string(), text: z.string() })).optional(),
  }),
  z.object({ type: z.literal("diagram"), id: z.string(), title: z.string(), alt: z.string(), svgKey: z.string() }),
  z.object({ type: z.literal("interaction"), id: z.string(), itemFamily: z.string() }),
  z.object({ type: z.literal("nextStep"), id: z.string(), text: z.string() }),
]);
export type LessonBlock = z.infer<typeof LessonBlockSchema>;

export const LessonSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  capabilityId: z.string(),
  depth: Depth,
  title: z.string(),
  outcome: z.string(),
  prerequisites: z.array(z.string()).default([]),
  bridges: z.array(BridgeSchema).min(1),
  simplerExplanation: z.string(),
  deeperExplanation: z.string(),
  misconceptions: z.array(z.object({ id: z.string(), claim: z.string(), repair: z.string() })).default([]),
  sources: z.array(z.object({ label: z.string(), note: z.string(), dated: z.string().optional() })).default([]),
  blocks: z.array(LessonBlockSchema).min(3),
  durationMinutes: z.tuple([z.number(), z.number()]),
  /** Item family used for the independent check inside this lesson. */
  primaryFamily: z.string(),
  /** Item family used for the transfer check after this lesson. */
  transferFamily: z.string(),
  /** Shorter single-item family for a 10-minute session. */
  shortFamily: z.string().optional(),
  reviewPrompt: z.string(),
  status: z.enum(["published", "draft"]),
});
export type Lesson = z.infer<typeof LessonSchema>;

export const CriterionSchema = z.object({
  id: z.string(),
  label: z.string(),
  critical: z.boolean(),
  /** Words or phrases whose presence in written work indicates this criterion (deterministic pre-check). */
  cues: z.array(z.string()).default([]),
  /** Phrases that indicate the criterion has been violated. */
  antiCues: z.array(z.string()).default([]),
});

export const RubricSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  criteria: z.array(CriterionSchema).min(1),
  /** Number of supporting (non-critical) criteria required in addition to all critical criteria. */
  supportingRequired: z.number().int().min(0).default(1),
});
export type Rubric = z.infer<typeof RubricSchema>;

const SelectedOption = z.object({
  id: z.string(),
  text: z.string(),
  /** Misconception triggered by choosing this wrong option, if any. */
  misconceptionId: z.string().optional(),
});

export const ItemPromptSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("selected"),
    question: z.string(),
    options: z.array(SelectedOption).min(2),
    allowUnsure: z.boolean().default(true),
  }),
  z.object({
    kind: z.literal("written"),
    question: z.string(),
    guidance: z.string().optional(),
    minChars: z.number().int().default(40),
  }),
  z.object({
    kind: z.literal("worksheet"),
    question: z.string(),
    fields: z.array(z.object({ id: z.string(), label: z.string(), placeholder: z.string().optional(), multiline: z.boolean().default(false) })).min(1),
  }),
]);
export type ItemPrompt = z.infer<typeof ItemPromptSchema>;

/** Server-only answer key. Never sent to the browser. */
export const AnswerKeySchema = z.object({
  /** For selected items: the correct option ids. */
  correctOptionIds: z.array(z.string()).optional(),
  /** For written work: the reference answer shown after assistance is requested. */
  workedAnswer: z.string(),
  /** Accepted alternative reasoning notes for the evaluator. */
  acceptedAlternatives: z.array(z.string()).default([]),
  /** Critical errors that fail the item outright. */
  criticalErrors: z.array(z.string()).default([]),
  /** Evaluator fixtures: sample submissions with expected results (used by tests and fixture mode). */
  evaluationCases: z
    .array(z.object({ label: z.string(), submission: z.string(), expected: z.enum(["pass", "fail", "provisional"]) }))
    .default([]),
});

export const ItemFamilySchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  capabilityId: z.string(),
  depth: Depth,
  /** Item family key: distinct families provide distinct independent evidence. */
  family: z.string(),
  taskKind: z.enum(["check", "transfer", "explain", "artefact", "review"]),
  domain: ContextDomain,
  title: z.string(),
  objective: z.string(),
  /** Supplied information shown to the learner (sources, quotes, traces). */
  supplied: z.array(z.object({ label: z.string(), text: z.string() })).default([]),
  prompt: ItemPromptSchema,
  successCriteria: z.string(),
  rubricId: z.string(),
  hints: z.array(z.string()).min(1).max(3),
  /** Feedback text keyed by misconception id, chosen when a wrong option or cue indicates it. */
  misconceptionFeedback: z.record(z.string(), z.string()).default({}),
  key: AnswerKeySchema,
  estimatedMinutes: z.number().int().positive(),
  status: z.enum(["published", "draft"]),
});
export type ItemFamily = z.infer<typeof ItemFamilySchema>;

export type PublicItem = Omit<ItemFamily, "key">;

export const PracticeTemplateSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  capabilityId: z.string(),
  depth: Depth,
  family: z.string(),
  kind: z.enum(["approval_boundary", "retrieval_explorer", "brief_editor"]),
  title: z.string(),
  simulates: z.string(),
  objective: z.string(),
  brief: z.string(),
  rubricId: z.string(),
  hints: z.array(z.string()).min(1),
  /** Scenario variants. The first is the default; a fresh scenario is used for independent evidence after assistance. */
  scenarios: z.array(
    z.object({
      key: z.string(),
      title: z.string(),
      description: z.string(),
      data: z.record(z.string(), z.unknown()),
    }),
  ).min(2),
  controls: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(["number", "select", "toggle", "text", "multiselect"]),
      options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
      default: z.unknown(),
      help: z.string().optional(),
    }),
  ),
  status: z.enum(["published", "draft"]),
});
export type PracticeTemplate = z.infer<typeof PracticeTemplateSchema>;

export const GoalSuggestionSchema = z.object({
  id: z.string(),
  destination: Destination,
  label: z.string(),
  text: z.string(),
});

export const CatalogueSchema = z.object({
  contentVersion: z.string(),
  capabilities: z.array(CapabilitySchema),
  milestones: z.array(MilestoneSchema),
  lessons: z.array(LessonSchema),
  items: z.array(ItemFamilySchema),
  rubrics: z.array(RubricSchema),
  practices: z.array(PracticeTemplateSchema),
  goalSuggestions: z.array(GoalSuggestionSchema),
});
export type Catalogue = z.infer<typeof CatalogueSchema>;
