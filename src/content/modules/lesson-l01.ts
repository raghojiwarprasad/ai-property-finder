import type { Lesson } from "../types";

/**
 * L01: match AI capabilities to tasks, risk and controls. Source: spec/06_USE_CASES.md UC02, first session.
 * Two fictional proposals: an assistant drafting internal summaries with human review, and an autonomous
 * system approving customer refunds. All financial figures are illustrative, not forecasts or advice.
 */
export const lessonL01: Lesson = {
  id: "LES-L01-match-capabilities", version: 1, capabilityId: "L01", depth: "analyse",
  title: "Capability is one factor; risk, data, evaluation and review are the others.",
  outcome: "Identify the evidence and controls a proposal needs before a pilot, weighing task risk, data availability, evaluation design and review effort alongside what the model can do.",
  prerequisites: ["F02"],
  bridges: [
    {
      domain: "leadership", requiresFactTypes: ["role"], keywords: ["lead", "manag", "director", "head of", "founder", "ceo", "board", "budget", "approve"],
      scenarioLabel: "imagined",
      text: "You have approved or turned down proposals before. Imagine two AI proposals land on your desk in the same week, each with a slide showing savings. The proposals below are fictional and every number is illustrative.",
      analogyLimit: "Most proposals you have judged came from people who could be held to a promise. An AI system's behaviour is not a promise; it has to be measured on your cases, which is why evidence and controls matter more than the confidence of the pitch.",
    },
    {
      domain: "operations", requiresFactTypes: ["action", "role"], keywords: ["operations", "process", "coordinat", "service", "support", "customer", "team"],
      scenarioLabel: "imagined",
      text: "You have run a process where mistakes had to be caught and corrected. Imagine two proposals to put AI into such a process: one drafts, one decides. The proposals below are fictional and every number is illustrative.",
      analogyLimit: "A new team member's mistakes cluster early and shrink with feedback. A deployed model's mistakes do not shrink on their own; the controls you set are the only thing that changes what happens after an error.",
    },
    {
      domain: "supplier_comparison", requiresFactTypes: ["action"], keywords: ["supplier", "vendor", "procure", "tender", "quote", "contract", "purchase"],
      scenarioLabel: "imagined",
      text: "You have compared what suppliers claim with what they can show. Imagine two AI proposals from vendors, each confident about model capability. The proposals below are fictional and every number is illustrative.",
      analogyLimit: "A supplier's capability claim can be checked against a specification. A model capability claim measured on someone else's data does not transfer to yours until it is measured on your cases.",
    },
    {
      domain: "marketing", requiresFactTypes: ["action", "role"], keywords: ["campaign", "marketing", "brand", "audience", "content", "copy"],
      scenarioLabel: "imagined",
      text: "You have decided what a campaign needs before it goes out. Imagine judging two AI proposals the same way: what has to be true before either is allowed to act? The proposals below are fictional and every number is illustrative.",
      analogyLimit: "A campaign that underperforms is a cost. An automated decision that is wrong at scale can be a cost plus a liability, so the review question is different in kind, not just degree.",
    },
    {
      domain: "software", requiresFactTypes: ["tool", "role", "action"], keywords: ["software", "developer", "engineer", "code", "api", "deploy", "release"],
      scenarioLabel: "imagined",
      text: "You have decided whether a change was safe to ship. Imagine two AI proposals: one writes drafts that people read, one takes actions that money follows. The proposals below are fictional and every number is illustrative.",
      analogyLimit: "A feature flag lets you roll back code. An automated refund that has been paid cannot be rolled back by a flag, so the control has to sit before the action, not after.",
    },
    {
      domain: "general", requiresFactTypes: [], keywords: [],
      scenarioLabel: "imagined",
      text: "Imagine two AI proposals arrive in the same week: an assistant that drafts internal summaries for people to review, and a system that approves customer refunds on its own. The proposals below are fictional and every number is illustrative.",
      analogyLimit: null,
    },
  ],
  simplerExplanation:
    "Before you let an AI system loose on a task, ask four things besides whether the model is clever enough. How bad is a mistake (task risk)? Do we have the records it needs (data)? How will we know how often it is wrong (evaluation)? And how much human time will checking and fixing take (review effort)? A summary that a person reads before using is low risk. A refund that goes out automatically is money gone. Same model, different questions.",
  deeperExplanation:
    "Formal statement: the suitability of an AI proposal is a function of task risk, data availability, evaluation design and review effort, not of model capability alone. Task risk is the cost and reversibility of a wrong output. Data availability is whether the inputs the system needs, and labelled past cases to test it against, exist and are usable. Evaluation design is how error rate and error cost will be measured on your own cases, against a baseline of the current process. Review effort is the human time needed to check outputs and handle exceptions; if every output must be checked, projected savings may be consumed by checking. Controls follow from risk: low-risk drafting needs a human reader; consequential actions need approval, thresholds or a shadow phase in which the system recommends without acting. Limits: this lesson does not tell you which vendor or model to choose, and the figures used are illustrative.",
  misconceptions: [
    { id: "savings_prove_value", claim: "A business case that shows projected savings is enough to justify a pilot.", repair: "Savings are a projection about the good outputs. The pilot decision also needs the error rate, the cost of a wrong output, and the review effort, which can remove the apparent benefit." },
    { id: "capability_equals_fit", claim: "If the model is capable enough, the task is suitable for it.", repair: "Capability measured elsewhere does not settle risk, data or review on your task. A very capable model approving refunds without a control is still a bad proposal." },
    { id: "automation_removes_review", claim: "Automating a task removes the need for human review.", repair: "Automation moves review, it does not remove it. Someone still has to check outputs, handle exceptions and own what happens when the system is wrong." },
    { id: "demo_is_evidence", claim: "A convincing demonstration is evidence of performance on our cases.", repair: "A demo shows what the system does on chosen examples. Evidence is a measured error rate on a sample of your own past cases, compared with the current process." },
  ],
  sources: [
    { label: "Fictional proposals", note: "Both proposals, the company and every figure are invented for this lesson. Numbers are illustrative and are not market forecasts or investment advice." },
  ],
  blocks: [
    { type: "orientation", id: "b1", text: "This lesson takes about twelve minutes. You will read two fictional proposals for the same company, decide what each needs before a pilot, and see why projected savings alone cannot settle the decision." },
    {
      type: "example", id: "b2", heading: "Proposal A: an assistant that drafts internal summaries",
      text: "A services company (fictional) receives long weekly status reports from twelve teams. Proposal A: an assistant drafts a one-page summary of each report; the report's author reads and corrects the draft before it is circulated.",
      sources: [
        { label: "Proposal A extract", text: "Projected saving: about 30 hours a month of writing time (illustrative). Each draft is reviewed by the report's author before circulation. Inputs: the report itself. Errors are visible to the reviewer before anyone acts on them." },
      ],
    },
    {
      type: "example", id: "b3", heading: "Proposal B: a system that approves refunds on its own",
      text: "The same company handles customer refund requests. Proposal B: a system reads the request and the order history and approves or declines the refund automatically, with no person in the loop.",
      sources: [
        { label: "Proposal B extract", text: "Projected saving: about 90 hours a month of agent time (illustrative). Refunds are paid immediately on approval. Inputs: the customer's message, the order record and the refund policy. No review step is proposed. The vendor demo shows twenty requests handled correctly." },
      ],
    },
    {
      type: "concept", id: "b4", heading: "Four questions alongside capability",
      text: "The same model could power both proposals, and the two are not equally ready. Ask: (1) Task risk: what does a wrong output cost and can it be reversed? A wrong draft is corrected by its reader; a wrong refund is money paid or a customer wrongly refused. (2) Data availability: does the system have the inputs it needs, and do labelled past cases exist to test it on? Proposal B depends on order records and a clear policy. (3) Evaluation design: how will the error rate be measured against a baseline, meaning the current process? A demo of twenty chosen requests is not a measurement. (4) Review effort: how much human time will checking and exceptions take? Proposal A builds review in. Proposal B has none, which means every error reaches a customer.",
    },
    {
      type: "example", id: "b5", heading: "When review effort removes the benefit (illustrative)",
      text: "Suppose Proposal B is piloted with a person checking every decision above a small amount. If checking a decision takes three minutes and there are 1,500 requests a month (illustrative), checking is 75 hours, most of the projected 90. If the system is wrong on 5% of cases and half of those are overpayments, the error cost may exceed what remains. None of these figures is a forecast; the point is that savings shown without error rate and review effort are not a business case yet.",
    },
    {
      type: "concept", id: "b6", heading: "Evidence and controls before a pilot",
      text: "Evidence: a measured error rate on a sample of your own past cases, the baseline the current process achieves, and confirmation that the needed data exists and is usable. Controls, scaled to risk: for drafting, a named reviewer is enough. For consequential actions, a control on the action itself: approval by a person, a threshold above which the system may only recommend, or a shadow phase where it decides on paper while people still decide for real. Then a stop rule: what result would pause the pilot.",
    },
    { type: "interaction", id: "b7", itemFamily: "pilot_controls" },
    { type: "nextStep", id: "b8", text: "Once you can name the evidence and controls a proposal needs, the next step is writing that down as a one-page pilot memo with a baseline, success measures and failure conditions." },
  ],
  durationMinutes: [10, 14],
  primaryFamily: "pilot_controls",
  transferFamily: "proposal_transfer_hr",
  shortFamily: "quick_task_risk",
  reviewPrompt: "In one sentence: why is a projected saving not enough to approve a pilot?",
  status: "published",
};
