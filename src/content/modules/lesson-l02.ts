import type { Lesson } from "../types";

/**
 * L02: design a small AI pilot with a baseline and success criteria. Source: spec/06_USE_CASES.md UC02
 * (session 5 and the milestone memo). The worked memo scenario and every figure are fictional and illustrative.
 */
export const lessonL02: Lesson = {
  id: "LES-L02-pilot-memo", version: 1, capabilityId: "L02", depth: "apply",
  title: "A pilot memo that could tell you to stop.",
  outcome: "Write a one-page pilot memo with task, baseline, data requirements, success measures, failure conditions, a human owner and a proceed-or-pause decision, stating unknowns explicitly.",
  prerequisites: ["L01", "F08"],
  bridges: [
    {
      domain: "leadership", requiresFactTypes: ["role"], keywords: ["lead", "manag", "director", "head of", "founder", "ceo", "board", "budget", "approve"],
      scenarioLabel: "imagined",
      text: "You have signed off work on the strength of a short document. Imagine the document is a one-page memo proposing an AI pilot, and it has to be good enough that you could later say it told you to stop. The scenario below is fictional and every number is illustrative.",
      analogyLimit: "A budget approval usually commits you to a plan. A pilot memo does the opposite: it commits you to a measurement and to a condition under which you will pause. Treat it as a test design, not a plan to adopt.",
    },
    {
      domain: "operations", requiresFactTypes: ["action", "role"], keywords: ["operations", "process", "coordinat", "service", "support", "helpdesk", "ticket", "team"],
      scenarioLabel: "imagined",
      text: "You have changed a process and wanted to know whether the change helped. Imagine writing down, before the change, what the process does today and what number would show improvement. The scenario below is fictional and every number is illustrative.",
      analogyLimit: "A process change made by people can be adjusted week by week from experience. A pilot memo fixes the measure and the stop rule in advance, so that the result cannot be argued into success afterwards.",
    },
    {
      domain: "software", requiresFactTypes: ["tool", "role", "action"], keywords: ["software", "developer", "engineer", "code", "api", "deploy", "release", "feature"],
      scenarioLabel: "imagined",
      text: "You have shipped something behind a flag and watched a metric. Imagine the same discipline written as a one-page memo for people who will not read a dashboard. The scenario below is fictional and every number is illustrative.",
      analogyLimit: "A rollout metric measures the software. A pilot memo also has to name the person who owns the outcome and the data the system needs, which no dashboard records.",
    },
    {
      domain: "marketing", requiresFactTypes: ["action", "role"], keywords: ["campaign", "marketing", "brand", "audience", "content", "copy"],
      scenarioLabel: "imagined",
      text: "You have set a target for a campaign before it launched. Imagine setting a target for an AI pilot the same way, plus the result that would make you pull it. The scenario below is fictional and every number is illustrative.",
      analogyLimit: "A campaign target is usually about reach or response. A pilot success measure must also cover how often the system is wrong, because a fast, wrong output is not a success.",
    },
    {
      domain: "community", requiresFactTypes: [], keywords: ["event", "volunteer", "community", "organis", "organiz", "club", "school", "charity"],
      scenarioLabel: "imagined",
      text: "You have tried a new way of organising something and had to decide whether to keep it. Imagine writing, on one page, what you are trying, how you will know it worked and when you would stop. The scenario below is fictional and every number is illustrative.",
      analogyLimit: "With volunteers, a change that people like is often worth keeping. A pilot memo needs an observable measure, because 'people liked it' cannot tell you whether the system was wrong.",
    },
    {
      domain: "general", requiresFactTypes: [], keywords: [],
      scenarioLabel: "imagined",
      text: "Imagine you are asked to approve a small AI pilot and you want one page that says what is being tried, how anyone will know whether it worked, and when it would be stopped. The scenario below is fictional and every number is illustrative.",
      analogyLimit: null,
    },
  ],
  simplerExplanation:
    "A pilot memo is one page with seven parts: what the system will do (task); what happens today and how well (baseline); what records it needs (data); the number that would show it worked (success measure); the result that would make you stop (failure condition); the person responsible (owner); and your decision, proceed or pause. Write the baseline and the stop rule before you start, or the pilot can only ever look like a success. Saying 'we do not know this yet' is a strength: it is the thing the pilot is for.",
  deeperExplanation:
    "Formal statement: a pilot is an experiment with a decision attached, so its memo must fix the comparison and the decision rule before data arrives. The baseline is the current process measured in the same units as the success measure; without it, 'improvement' has no reference. The success measure must be observable by someone other than the proposer (a rate, a time, a count over a stated period), not a feeling. The failure condition is a pre-committed stop rule, which protects against interpreting any result as progress. The human owner is accountable for the decision and for what happens when the system is wrong. Data requirements state what must exist, in usable form, for the pilot to run. Explicit unknowns are rewarded because they turn vague risk into things the pilot will measure. Limits: a memo fixes a design, not an outcome, and a pause decision can be the right output of a good memo. Nothing here favours adopting a product; a memo that recommends waiting for a baseline can be stronger than one that recommends proceeding.",
  misconceptions: [
    { id: "memo_must_recommend_adopt", claim: "A good pilot memo recommends going ahead; a pause looks like failure.", repair: "The memo is judged on whether its comparison and stop rule are sound, not on its decision. Pausing to establish a baseline or obtain data is often the stronger memo." },
    { id: "success_is_satisfaction", claim: "'The team likes it' or 'it feels faster' is a success measure.", repair: "A success measure must be observable by someone else: a rate, a time or a count over a stated period, compared with the baseline." },
    { id: "baseline_is_optional", claim: "If nobody has measured the current process, skip the baseline and measure the pilot alone.", repair: "Without a baseline the pilot number has nothing to be compared with. If no measurement exists, measuring the current process is the first step, and the memo can say so." },
    { id: "unknowns_look_weak", claim: "Listing what you do not know makes the memo look unprepared.", repair: "Unknowns written down become things the pilot measures. A memo with no unknowns is claiming certainty it cannot have." },
  ],
  sources: [
    { label: "Fictional worked memo", note: "The IT helpdesk scenario, the company and all numbers are invented and illustrative. They are not forecasts, benchmarks or advice." },
  ],
  blocks: [
    { type: "orientation", id: "b1", text: "This lesson takes about twelve minutes. You will see the seven parts of a pilot memo, read a short worked memo for a fictional helpdesk, and then write one yourself for a new scenario." },
    {
      type: "concept", id: "b2", heading: "The seven parts",
      text: "1. Task: what the system does and what it does not do. 2. Baseline: what the current process achieves, in the same units you will measure the pilot in. 3. Data requirements: what records the system needs, and whether they exist in usable form. 4. Success measures: observable numbers over a stated period. 5. Failure conditions: the result that stops the pilot. 6. Human owner: the person accountable for the decision and for errors. 7. Decision: proceed or pause, with the reason.",
    },
    {
      type: "example", id: "b3", heading: "Worked memo: first replies to internal IT tickets (fictional)",
      text: "A fictional company's IT helpdesk receives about 400 tickets a week (illustrative). Two staff write a first reply to each. The proposal: an assistant drafts the first reply; a staff member edits and sends it.",
      sources: [
        { label: "Memo (fictional, all figures illustrative)", text: "Task: assistant drafts a first reply for password, access and printer tickets only; staff edit and send; it never sends on its own. Baseline: staff currently take a median of 9 minutes to first reply; in a spot check of 50 tickets, 6 first replies needed a follow-up correction. Data: four weeks of past tickets with the sent reply, exported with names removed; we do not yet know whether the export includes the final reply text. Success: over four weeks, median time to first reply below 6 minutes and corrections in a 50-ticket spot check no higher than 6, judged by a staff member who did not edit the draft. Failure: pause if corrections exceed 10 in the spot check, or if any draft contains an instruction that would change access rights. Owner: the helpdesk supervisor. Decision: pause for two weeks to confirm the export contains reply text, then proceed if it does." },
      ],
    },
    {
      type: "concept", id: "b4", heading: "Why the baseline and the stop rule come first",
      text: "The memo fixes the comparison before the pilot runs. Without the baseline (9 minutes, 6 corrections in 50), a pilot result of 6 minutes would have nothing to be compared with. Without the stop rule, any result could be read as encouraging. The success measure is observable: a median time and a count in a spot check, judged by someone who did not write the drafts. 'Staff find it helpful' would not do; it cannot tell you whether the drafts were wrong.",
    },
    {
      type: "concept", id: "b5", heading: "Why explicit unknowns are rewarded",
      text: "The worked memo says it does not know whether the export contains reply text. That sentence is the reason for its pause decision, and it turns a vague risk into a two-week check. A memo with no unknowns is claiming a certainty the writer cannot have. The memo is judged on whether its comparison and stop rule are sound, not on whether it says proceed. A pause can be the right answer.",
    },
    { type: "interaction", id: "b6", itemFamily: "pilot_memo" },
    { type: "nextStep", id: "b7", text: "With a memo written, the final step in this bundle is critiquing a vendor proposal for a new scenario without the checklist in front of you." },
  ],
  durationMinutes: [10, 15],
  primaryFamily: "pilot_memo",
  transferFamily: "memo_critique_transfer",
  shortFamily: "quick_memo_gap",
  reviewPrompt: "In one sentence: what must be written down before a pilot starts, and why?",
  status: "published",
};
