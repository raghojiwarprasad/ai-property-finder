import type { z } from "zod";
import type { CapabilitySchema } from "./types";

type CapabilityInput = z.input<typeof CapabilitySchema>;

/**
 * Capability graph. Foundation spine F01–F10 from spec/05_CURRICULUM_AND_CONTENT_SYSTEM.md
 * plus goal-specific capabilities. `status` here is the authored intent; the validator
 * downgrades a capability to "draft" for catalogue purposes when its evidence path is
 * incomplete (no published lesson, or too few independent item families).
 */
export const capabilities: CapabilityInput[] = [
  {
    id: "F01", version: 1, title: "Tell AI, machine learning and generative AI apart",
    outcome: "Classify examples of AI systems and explain a boundary case, including broad versus domain-specific applications.",
    depths: ["explain", "apply"], prerequisites: [], kind: "conceptual", status: "published",
    evidenceContract: { requiredFamilies: 2, requireTransfer: true, requireArtefact: false },
  },
  {
    id: "F02", version: 1, title: "Understand generation and uncertainty",
    outcome: "Recognise that a fluent, specific answer can be unsupported, and identify unsupported certainty in an output.",
    depths: ["explain", "apply"], prerequisites: [], kind: "conceptual", status: "published",
    evidenceContract: { requiredFamilies: 2, requireTransfer: true, requireArtefact: false },
  },
  {
    id: "F03", version: 1, title: "State a task, context, constraints and output",
    outcome: "Write a task brief that names the objective, supplied context, constraints including source boundaries, and the required output.",
    depths: ["apply"], prerequisites: ["F04"], kind: "applied", status: "published",
    evidenceContract: { requiredFamilies: 2, requireTransfer: true, requireArtefact: true },
  },
  {
    id: "F04", version: 1, title: "Check claims against evidence",
    outcome: "Find an unsupported claim using supplied sources, preserve the original uncertainty, and say what the assistant should do when the source is silent.",
    depths: ["apply"], prerequisites: [], kind: "conceptual", status: "published",
    evidenceContract: { requiredFamilies: 2, requireTransfer: true, requireArtefact: false },
  },
  {
    id: "F05", version: 1, title: "Understand data boundaries and privacy",
    outcome: "Choose what information may be included in an AI task and what must stay out.",
    depths: ["apply"], prerequisites: ["F03"], kind: "conceptual", status: "draft",
  },
  {
    id: "F06", version: 1, title: "Understand retrieval and context",
    outcome: "Explain what retrieved material can and cannot guarantee, and diagnose whether a failure came from retrieval, synthesis or missing information.",
    depths: ["explain", "apply"], prerequisites: ["F04"], kind: "conceptual", status: "published",
    evidenceContract: { requiredFamilies: 2, requireTransfer: true, requireArtefact: false },
  },
  {
    id: "F07", version: 1, title: "Distinguish a workflow, a tool call and an agent",
    outcome: "Select an appropriate level of autonomy for a task.",
    depths: ["explain", "apply"], prerequisites: ["F09"], kind: "conceptual", status: "draft",
  },
  {
    id: "F08", version: 1, title: "Evaluate an AI output systematically",
    outcome: "Create criteria for a task and apply them consistently to examples, separating style from factual support.",
    depths: ["apply"], prerequisites: ["F04"], kind: "applied", status: "published",
    evidenceContract: { requiredFamilies: 2, requireTransfer: true, requireArtefact: true },
  },
  {
    id: "F09", version: 1, title: "Understand human control and failure handling",
    outcome: "Configure an approval or fallback condition so that an AI workflow cannot take a consequential action without the right check.",
    depths: ["apply"], prerequisites: ["F06"], kind: "applied", status: "published",
    evidenceContract: { requiredFamilies: 2, requireTransfer: true, requireArtefact: true },
  },
  {
    id: "F10", version: 1, title: "Run a small improvement experiment",
    outcome: "Compare two approaches against a fixed evaluation set and state what the comparison does and does not establish.",
    depths: ["apply"], prerequisites: ["F08"], kind: "applied", status: "draft",
  },
  // Leadership depth
  {
    id: "L01", version: 1, title: "Match AI capabilities to tasks, risk and controls",
    outcome: "Identify the evidence and controls a proposal needs before a pilot, considering task risk, data availability and review effort alongside model capability.",
    depths: ["analyse"], prerequisites: [], kind: "conceptual", status: "published",
    evidenceContract: { requiredFamilies: 2, requireTransfer: true, requireArtefact: false },
  },
  {
    id: "L02", version: 1, title: "Design a small AI pilot with a baseline and success criteria",
    outcome: "Write a one-page pilot memo with task, baseline, data requirements, success measures, failure conditions, human owner and a proceed or pause decision.",
    depths: ["apply"], prerequisites: ["L01", "F08"], kind: "applied", status: "published",
    evidenceContract: { requiredFamilies: 2, requireTransfer: true, requireArtefact: true },
  },
  // Marketing depth
  {
    id: "M01", version: 1, title: "Build a source-backed campaign brief",
    outcome: "Produce a campaign brief whose factual claims are each traceable to supplied evidence, with instructions that prevent overstatement.",
    depths: ["apply"], prerequisites: ["F04", "F03"], kind: "applied", status: "published",
    evidenceContract: { requiredFamilies: 2, requireTransfer: true, requireArtefact: true },
  },
  {
    id: "M02", version: 1, title: "Design a controlled comparison and state its limits",
    outcome: "Plan an A/B comparison for creative variants and explain what it can and cannot establish.",
    depths: ["analyse"], prerequisites: ["F08"], kind: "conceptual", status: "published",
    evidenceContract: { requiredFamilies: 2, requireTransfer: true, requireArtefact: false },
  },
  // Builder depth
  {
    id: "B01", version: 1, title: "Diagnose retrieval, synthesis and missing-information failures",
    outcome: "Read a request, retrieved snippets and an answer, and attribute a wrong answer to retrieval, synthesis or insufficient information with evidence from the trace.",
    depths: ["analyse"], prerequisites: ["F06"], kind: "conceptual", status: "published",
    evidenceContract: { requiredFamilies: 2, requireTransfer: true, requireArtefact: false },
  },
  {
    id: "B02", version: 1, title: "Design an evaluation set for a grounded assistant",
    outcome: "Write evaluation cases that cover normal, missing-source and conflicting-source situations with an expected behaviour for each.",
    depths: ["build"], prerequisites: ["B01", "F08"], kind: "applied", status: "published",
    evidenceContract: { requiredFamilies: 2, requireTransfer: true, requireArtefact: true },
  },
  // Research foundations
  {
    id: "R01", version: 1, title: "Understand a fair test of a prediction system",
    outcome: "Explain why evaluating on examples used to tune a system overstates performance, and propose a fairer procedure while noting sample-size uncertainty.",
    depths: ["explain", "apply"], prerequisites: [], kind: "conceptual", status: "published",
    evidenceContract: { requiredFamilies: 2, requireTransfer: true, requireArtefact: false },
  },
  {
    id: "R02", version: 1, title: "Summarise data tables with simple arithmetic",
    outcome: "Compute and interpret averages, ranges and error summaries from a small table.",
    depths: ["apply"], prerequisites: ["R01"], kind: "applied", status: "draft",
  },
  {
    id: "R03", version: 1, title: "Describe a function as an input-output mapping",
    outcome: "Explain a prediction rule as a function and evaluate it on new inputs.",
    depths: ["explain"], prerequisites: ["R02"], kind: "conceptual", status: "draft",
  },
  {
    id: "R04", version: 1, title: "Read a short program that computes a prediction",
    outcome: "Trace a small script and explain what it computes.",
    depths: ["apply"], prerequisites: ["R03"], kind: "applied", status: "draft",
  },
  {
    id: "R05", version: 1, title: "Separate training from evaluation and recognise leakage",
    outcome: "Identify leakage in an experimental setup and correct it.",
    depths: ["analyse"], prerequisites: ["R01", "R04"], kind: "conceptual", status: "draft",
  },
  {
    id: "R06", version: 1, title: "Vectors, probability and gradients for learning systems",
    outcome: "Use the mathematical foundations needed to read a model description.",
    depths: ["apply"], prerequisites: ["R03"], kind: "conceptual", status: "draft",
  },
  {
    id: "R07", version: 1, title: "Read a paper's method, assumptions and limitations",
    outcome: "Explain what a paper claims, how it tested it and what the result does not establish.",
    depths: ["investigate"], prerequisites: ["R05", "R06"], kind: "conceptual", status: "draft",
  },
];
