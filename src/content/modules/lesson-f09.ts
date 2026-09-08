import type { Lesson } from "../types";

/**
 * F09: Understand human control and failure handling.
 * UC01 session 4 and UC04 session 5. The deterministic approval-boundary simulation is a separate practice
 * template; this lesson teaches the ideas it exercises. Tidewater Goods and every workflow here are fictional.
 */
export const lessonF09: Lesson = {
  id: "LES-F09-control", version: 1, capabilityId: "F09", depth: "apply",
  title: "When must a person decide?",
  outcome: "Set an approval threshold and a fallback for an AI workflow so that no consequential action happens without the right check, and explain why a confirmation click is not by itself a control.",
  prerequisites: ["F06"],
  bridges: [
    {
      domain: "supplier_comparison", requiresFactTypes: ["action"], keywords: ["supplier", "bid", "quote", "procure", "vendor", "purchase", "tender", "purchase order"],
      scenarioLabel: "imagined",
      text: "You have worked with a rule that purchases above a certain value need a signature. Imagine the same rule applied to an assistant that can approve refunds: below a line it acts, above it a person decides. The scenario below is fictional.",
      analogyLimit: "A signature threshold controls value. An assistant's threshold also has to cover uncertainty: what it does when it cannot find the order or is not sure the item matches.",
    },
    {
      domain: "operations", requiresFactTypes: ["action", "role"], keywords: ["operations", "coordinat", "logistic", "schedule", "delivery", "project", "process", "workflow"],
      scenarioLabel: "imagined",
      text: "You have designed a process where some steps run without anyone looking and others stop for a check. Imagine deciding which steps of a refund workflow an assistant may run alone. The scenario below is fictional.",
      analogyLimit: "In a human process the person at the check step usually reads the case. With an assistant, the check step only counts as a control if the person actually sees the evidence and can change the outcome.",
    },
    {
      domain: "leadership", requiresFactTypes: ["role"], keywords: ["lead", "manager", "director", "founder", "head of", "ceo", "owner"],
      scenarioLabel: "imagined",
      text: "You have set limits on what people may approve without escalation. Imagine setting the same limits for an assistant, and asking what happens when it hits a case the limits did not anticipate. The scenario below is fictional.",
      analogyLimit: "Delegation to a person comes with judgement about the unexpected. An assistant's fallback for the unexpected has to be written down, because it will not improvise safely.",
    },
    {
      domain: "software", requiresFactTypes: ["tool", "role", "action"], keywords: ["python", "api", "software", "developer", "engineer", "code", "http", "web service", "tool"],
      scenarioLabel: "imagined",
      text: "You have scoped permissions so that a service can read widely but write only where it must. Imagine the same for an assistant with tools: which calls it may make alone, which need approval, and what it does when a call fails. The scenario below is fictional.",
      analogyLimit: "A permission denies a call outright. An approval boundary lets the call happen after a person has seen the case, so the interface for that person is part of the control, not decoration.",
    },
    {
      domain: "community", requiresFactTypes: [], keywords: ["event", "volunteer", "community", "charity", "club", "organis", "organiz", "student"],
      scenarioLabel: "imagined",
      text: "You have organised something where some decisions could be made by anyone and others needed the organiser. Imagine an assistant helping with that, and deciding which decisions it must hand back. The scenario below is fictional.",
      analogyLimit: "In a group, people notice when something is off and ask. An assistant will only ask if a rule tells it when it is unsure enough to stop.",
    },
    {
      domain: "general", requiresFactTypes: [], keywords: [],
      scenarioLabel: "imagined",
      text: "Imagine an assistant that handles refund requests for an online shop. Some refunds are small and obvious; some are large or odd. The question is which ones it may approve on its own, which ones a person must decide, and what it does when it cannot tell. The scenario below is fictional.",
      analogyLimit: null,
    },
  ],
  simplerExplanation:
    "Some things an assistant does are easy to undo and cheap if wrong, like drafting a reply. Others are hard to undo and expensive if wrong, like paying money out. Let it do the first kind on its own. For the second kind, set a line: below it, act; above it, a person decides. When the assistant is not sure, or something it needs is missing, it should stop and hand the case to a person, not guess. And a person deciding means they see the details and can say no. A button that gets clicked without looking is not a decision, it is a delay.",
  deeperExplanation:
    "Human control in an AI workflow is defined by three elements. An approval boundary partitions actions into those the system may execute autonomously and those that require a human decision; the partition is set by consequence (cost, reversibility, who is affected) combined with the system's uncertainty, not by confidence alone. A threshold expresses the boundary as a checkable condition (refund value, absence of a matching order, a confidence score below a level, a request type outside policy). A fallback specifies the safe default when a precondition fails: lookups that error or time out, missing data, low confidence. The safe default is the action with the smallest irreversible consequence, usually to take no consequential action, queue the case for a person, and tell the requester it is being reviewed. An approval step is only a control if the approver receives the evidence and the system's reasoning, has time and authority to decide, and can change the outcome; an approval that is routinely granted in seconds without inspection provides no control and the workflow is autonomous in practice. Requiring approval for everything produces exactly that outcome through fatigue, so thresholds must be selective. Confidence values are the model's self-report and are not calibrated guarantees; they can gate actions but cannot replace consequence-based limits.",
  misconceptions: [
    { id: "button_is_control", claim: "If a person clicks 'confirm' before the action, the workflow is under human control.", repair: "A click is a control only when the person sees the case and the evidence, has time and authority to decide, and can change the outcome. A confirm button pressed in a second without inspection is automation with a delay." },
    { id: "confidence_is_correctness", claim: "A high confidence score means the assistant is right, so high-confidence actions can be automatic whatever the stakes.", repair: "Confidence is the model's self-report, not a guarantee. Set the boundary by consequence and reversibility first; use confidence only to decide when a low-stakes action should also stop." },
    { id: "fail_open_is_helpful", claim: "When a lookup fails or the assistant is unsure, it should do the helpful thing (approve) so nobody is kept waiting.", repair: "A failed precondition means the assistant does not know what it is approving. The safe fallback is to take no consequential action, queue the case for a person and tell the requester it is being reviewed." },
    { id: "approve_everything", claim: "The safest design is to require approval for every action.", repair: "If every action needs approval, the approver stops reading and the button becomes a rubber stamp. Reserve approval for consequential or irreversible actions and let reversible, low-cost actions run." },
  ],
  sources: [
    { label: "Fictional workflows", note: "Tidewater Goods, Greenway Pantry, Calder Components, Brightwater Books and their refund, scheduling and purchasing workflows are invented for these exercises." },
  ],
  blocks: [
    { type: "orientation", id: "b1", text: "This lesson takes about twelve minutes. You will read a fictional refund workflow, decide which of its actions an assistant may take alone, set a threshold and a fallback, and see why one popular 'control' is not one. A separate simulation lets you try thresholds on generated cases." },
    {
      type: "example", id: "b2", heading: "The workflow",
      text: "Tidewater Goods, a fictional homewares shop, uses an assistant on refund requests.",
      sources: [
        { label: "What the assistant can do", text: "(1) Look up the order. (2) Check the request against the refund policy. (3) Draft a reply to the customer. (4) Approve a refund, which pays the customer. (5) Decline a refund. (6) Mark the case as needing review." },
        { label: "Facts about refunds", text: "Most refunds are under 40. A wrong approval costs the refund amount. A wrong decline costs a complaint and usually a later refund anyway. The order lookup fails on about 2% of requests because of a system timeout. Policy covers unopened returns and damaged items with a photo; it says nothing about items damaged in a customer's own storage." },
        { label: "The current design", text: "The assistant approves any refund when its confidence is above 0.8. A supervisor gets a 'Confirm' button for the rest and clears about 300 a day, mostly without opening the case." },
      ],
    },
    {
      type: "concept", id: "b3", heading: "Draw the boundary by consequence, then by uncertainty",
      text: "Sort the actions. Looking up, checking and drafting are reversible and cheap; the assistant can do them alone. Approving pays money out: partly reversible, bounded cost. Declining is cheap to reverse but costs goodwill. Marking for review is the safe action. A workable boundary: approve automatically only when the refund is at or below 40, the order is found, the request matches a policy case, and the item and date match the order. Anything above 40, any request outside policy (storage damage), and any case where a precondition fails goes to a person. Confidence is not the boundary: a confident approval of a 900 refund is still a 900 mistake if it is wrong. Confidence can add a stop (below 0.8, even small refunds go to review) but cannot remove one.",
    },
    {
      type: "concept", id: "b4", heading: "Fallbacks, and why the Confirm button is not a control",
      text: "A fallback is what happens when something the boundary relies on is missing. Lookup timed out: do not approve, do not decline; queue the case, retry the lookup, tell the customer it is being reviewed. No photo on a damage claim: ask for one, do not decide. Request outside policy: route to a person with a note saying why. Now the Confirm button. The supervisor clears 300 a day without opening cases, so the button changes the outcome of nothing; the workflow is autonomous with a delay. A control needs the person to see the order, the request and the assistant's reasoning, to have time to read them, to have the authority to say no, and for the refund to wait on that decision. Fewer cases reaching the person, each with the evidence attached, is more control than a button on every case.",
    },
    { type: "interaction", id: "b5", itemFamily: "approval_policy_written" },
    { type: "nextStep", id: "b6", text: "The simulation for this capability lets you set a threshold and a fallback on generated refund cases and watch what gets through. After that, the transfer task asks the same questions of a scheduling assistant, where the consequences are people's time rather than money." },
  ],
  durationMinutes: [10, 15],
  primaryFamily: "approval_policy_written",
  transferFamily: "control_transfer_scheduling",
  shortFamily: "quick_control",
  reviewPrompt: "In two sentences: what makes an approval step a real control rather than a button, and what should an assistant do when a lookup it depends on fails?",
  status: "published",
};
