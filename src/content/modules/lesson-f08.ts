import type { Lesson } from "../types";

/**
 * F08: evaluate an AI output systematically. Criteria before judging, style separated from factual
 * support, the same criteria applied to every output. The meeting note and both summaries are fictional.
 */
export const lessonF08: Lesson = {
  id: "LES-F08-evaluate-systematically", version: 1, capabilityId: "F08", depth: "apply",
  title: "Write the criteria before you look.",
  outcome: "Create a small set of criteria for a task and apply the same criteria to each output, separating style from factual support.",
  prerequisites: ["F04"],
  bridges: [
    {
      domain: "operations", requiresFactTypes: ["action", "role"], keywords: ["operations", "process", "coordinat", "meeting", "minutes", "report", "team"],
      scenarioLabel: "imagined",
      text: "You have read a summary of a meeting and wondered whether it matched what was actually said. Imagine two AI summaries of the same short meeting note, and you have to say which is better and why. The note and summaries below are fictional.",
      analogyLimit: "When you check a colleague's minutes you can ask them what they meant. An AI summary has no memory of the meeting; the only check is the note itself, line by line.",
    },
    {
      domain: "marketing", requiresFactTypes: ["action", "role"], keywords: ["campaign", "marketing", "brand", "copy", "content", "audience"],
      scenarioLabel: "imagined",
      text: "You have judged two pieces of copy and preferred one. Imagine being asked to show your criteria before you read either, and to apply them to both. The note and summaries below are fictional.",
      analogyLimit: "In copy review, tone and polish are legitimate criteria. Here they are kept separate from a different question: whether each statement is supported by the source. Polished and unsupported is still unsupported.",
    },
    {
      domain: "software", requiresFactTypes: ["tool", "role", "action"], keywords: ["software", "developer", "engineer", "code", "review", "test", "api"],
      scenarioLabel: "imagined",
      text: "You have reviewed code against a checklist rather than by feel. Imagine doing the same with two AI-written summaries: a fixed list of checks, applied to each. The note and summaries below are fictional.",
      analogyLimit: "A test suite gives a binary result. A rubric for text still needs a judgement per criterion; the discipline is that the criteria are fixed first and applied the same way to both outputs.",
    },
    {
      domain: "leadership", requiresFactTypes: ["role"], keywords: ["lead", "manag", "director", "head of", "founder", "ceo", "board"],
      scenarioLabel: "imagined",
      text: "You have been handed two versions of a document and asked which to use. Imagine deciding with three written criteria rather than an impression, so that someone else could reach the same answer. The note and summaries below are fictional.",
      analogyLimit: "Experienced judgement is valuable, but it cannot be handed to someone else or repeated on the next fifty outputs. A small written rubric can.",
    },
    {
      domain: "research", requiresFactTypes: [], keywords: ["research", "study", "thesis", "analysis", "review", "science"],
      scenarioLabel: "imagined",
      text: "You have assessed work against stated criteria. Imagine assessing two AI summaries with criteria you wrote before reading them, and recording a judgement per criterion. The note and summaries below are fictional.",
      analogyLimit: "Academic marking often weighs criteria. Here the point is simpler: one criterion about factual support against the source is not tradeable against style.",
    },
    {
      domain: "general", requiresFactTypes: [], keywords: [],
      scenarioLabel: "imagined",
      text: "Imagine two AI summaries of the same short meeting note. One reads beautifully; one is plain. You have to say which is better, in a way someone else could check. The note and summaries below are fictional.",
      analogyLimit: null,
    },
  ],
  simplerExplanation:
    "Before you read the outputs, write down three things a good one must do. Make one of them 'every statement is in the source'. Then check each output against the same three, one at a time, and write down the result. Keep 'reads well' separate from 'is true to the source', because a smooth summary can add something the source never said. A short fixed list beats a general impression because you can apply it to the next output, and so can someone else.",
  deeperExplanation:
    "Formal statement: a systematic evaluation fixes criteria before inspection and applies each criterion to every output, recording a judgement per criterion. Fixing criteria first prevents the judgement from being fitted to whichever output made the better first impression. Factual support (each claim traceable to the source) and style (clarity, tone, length) are separate criteria because they vary independently: a fluent output can be unsupported and a plain one accurate, and an overall impression tends to let fluency stand in for accuracy. A small rubric (three to five criteria) is preferred to a long one because each criterion must be applied consistently across outputs; consistency, not coverage, is what makes the evaluation reusable and comparable. Limits: criteria can themselves be wrong or incomplete, a rubric does not remove the need for judgement within each criterion, and the same rubric should be revised when it lets through a failure it should have caught.",
  misconceptions: [
    { id: "style_equals_quality", claim: "The more polished, confident summary is the better summary.", repair: "Polish is a property of the wording. Check each statement against the source; a polished summary that adds an unsupported claim fails the criterion that matters most." },
    { id: "impression_is_enough", claim: "An experienced reader can just tell which output is better.", repair: "An impression cannot be handed to someone else or applied the same way to the next output. Three written criteria can." },
    { id: "criteria_after_judging", claim: "Decide which output you prefer, then write criteria that explain the choice.", repair: "Criteria written afterwards are fitted to the preference. Write them before reading the outputs, then apply them to each." },
    { id: "more_criteria_better", claim: "A longer rubric is a more rigorous rubric.", repair: "Every criterion must be applied consistently to every output. A small rubric you apply the same way each time is more reliable than a long one applied loosely." },
  ],
  sources: [
    { label: "Fictional meeting note", note: "Project Kite, its attendees, dates and budget figure are invented for this lesson. The budget figure is illustrative." },
  ],
  blocks: [
    { type: "orientation", id: "b1", text: "This lesson takes about ten minutes. You will write three criteria before reading two AI summaries, then apply the same criteria to each and see why the plainer summary wins." },
    {
      type: "concept", id: "b2", heading: "Criteria before judging",
      text: "Write the criteria first. For a summary of a meeting note, a small set might be: (1) every statement can be traced to the note, nothing added; (2) every decision and open item in the note is included; (3) clear and short. Criterion 1 is about factual support. Criterion 3 is about style. They are kept separate on purpose.",
    },
    {
      type: "example", id: "b3", heading: "The source: a meeting note (fictional)",
      text: "Now, and only now, read the note and the two summaries.",
      sources: [
        { label: "Project Kite weekly note", text: "Attendees: Priya, Tom, Ana. Decisions: launch date moves from 14 October to 28 October because the print supplier needs two extra weeks. Tom to confirm the new date with the venue by Friday. Budget unchanged at 12,000 (illustrative). Open question: whether to keep the evening slot; no decision taken." },
        { label: "Summary A", text: "Launch moved from 14 Oct to 28 Oct (print supplier delay). Tom to confirm with venue by Friday. Budget stays 12,000. Evening slot still undecided." },
        { label: "Summary B", text: "The team agreed to move the launch to 28 October to give the print supplier the time it needs, and approved an extra 2,000 to cover the rush. Tom will confirm the venue by Friday. After discussion, the evening slot was dropped." },
      ],
    },
    {
      type: "concept", id: "b4", heading: "Apply the same criteria to each",
      text: "Summary A: criterion 1, every statement is in the note, passes. Criterion 2, all decisions and the open item are present, passes. Criterion 3, clear but terse, passes. Summary B: criterion 1 fails twice. The note says the budget is unchanged; B says an extra 2,000 was approved. The note says no decision was taken on the evening slot; B says it was dropped. Criterion 2: it omits that the slot is still open. Criterion 3: it reads well, passes. Under the rubric, A is the better summary, and anyone applying the same criteria would reach the same result.",
    },
    {
      type: "concept", id: "b5", heading: "Style is not support",
      text: "B is the more pleasant read, and that is exactly how an unsupported detail gets through. 'Approved an extra 2,000' sounds like something a meeting would decide; it is invented. Keeping style as its own criterion lets you say honestly that B reads better while failing on the criterion that matters. If you had only an overall impression, fluency would have stood in for accuracy.",
    },
    {
      type: "concept", id: "b6", heading: "Why a fixed small rubric beats an impression",
      text: "Three criteria applied the same way to each output can be handed to a colleague, repeated on the next fifty summaries and compared across them. An impression cannot. Keep the rubric small: every criterion is one more thing to apply consistently, and consistency is what makes the evaluation worth anything. Revise the rubric when it lets through a failure it should have caught.",
    },
    { type: "interaction", id: "b7", itemFamily: "criteria_design" },
    { type: "nextStep", id: "b8", text: "With a rubric you can apply consistently, the next step is using it to compare two approaches on a fixed set of examples and saying what the comparison does and does not establish." },
  ],
  durationMinutes: [8, 12],
  primaryFamily: "criteria_design",
  transferFamily: "apply_rubric_transfer",
  shortFamily: "quick_rubric",
  reviewPrompt: "In one sentence: why must criteria be written before reading the outputs?",
  status: "published",
};
