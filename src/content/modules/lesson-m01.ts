import type { Lesson } from "../types";

/**
 * M01: Build a source-backed campaign brief.
 * Marketing-depth branch of golden lesson 02. The product, factsheet, survey and company are fictional.
 */
export const lessonM01: Lesson = {
  id: "LES-M01-brief", version: 1, capabilityId: "M01", depth: "apply",
  title: "A brief the assistant cannot overstate.",
  outcome: "Turn a product factsheet into a campaign brief where every factual claim points at the line that supports it, and the instructions stop the assistant adding or strengthening claims.",
  prerequisites: ["F04", "F03"],
  bridges: [
    {
      domain: "marketing", requiresFactTypes: ["action", "role"], keywords: ["campaign", "marketing", "brand", "audience", "copy", "email", "content", "social"],
      scenarioLabel: "imagined",
      text: "You have taken a product's facts and turned them into copy that had to pass approval. Imagine an assistant drafts that copy for you from a factsheet. The scenario below is fictional.",
      analogyLimit: "Brand approval usually checks tone, style and legal wording. This lesson adds a separate check: whether each factual claim in the brief can be pointed back at a line in the factsheet.",
    },
    {
      domain: "supplier_comparison", requiresFactTypes: ["action"], keywords: ["supplier", "bid", "quote", "procure", "vendor", "purchase", "tender"],
      scenarioLabel: "imagined",
      text: "You have written up what a supplier offers so that other people could rely on it. Imagine writing the same kind of summary for a product, and then an assistant expands it into campaign copy. The scenario below is fictional.",
      analogyLimit: "A supplier's specification comes with a contract behind it. A factsheet is only as good as the evidence it cites, so the brief has to carry the evidence forward rather than assume it.",
    },
    {
      domain: "operations", requiresFactTypes: ["action", "role"], keywords: ["operations", "coordinat", "logistic", "schedule", "delivery", "project", "process"],
      scenarioLabel: "imagined",
      text: "You have handed a task to someone with written instructions and found out later which instruction was missing. Imagine the task is writing campaign copy and the person is an assistant that fills gaps confidently. The scenario below is fictional.",
      analogyLimit: "A colleague who is unsure will usually ask. An assistant given a gap in the brief will usually fill it with something plausible unless the brief tells it not to.",
    },
    {
      domain: "leadership", requiresFactTypes: ["role"], keywords: ["lead", "manager", "director", "founder", "head of", "ceo", "owner"],
      scenarioLabel: "imagined",
      text: "You have signed off material that went out under the organisation's name. Imagine an assistant drafts campaign copy and you are the last check before it goes out. The scenario below is fictional.",
      analogyLimit: "Sign-off is a control at the end. This lesson is about the brief at the start, which decides how many unsupported claims reach sign-off in the first place.",
    },
    {
      domain: "software", requiresFactTypes: ["tool", "role", "action"], keywords: ["python", "api", "software", "developer", "engineer", "code", "http", "web service"],
      scenarioLabel: "imagined",
      text: "You have written an interface that only accepts certain inputs. Imagine a brief as the interface between a factsheet and an assistant: it defines what may go in and what must be rejected. The scenario below is fictional.",
      analogyLimit: "A type check rejects bad input mechanically. A brief is read by a model that can still drift, so it needs an explicit rule for silence as well as a list of allowed claims.",
    },
    {
      domain: "community", requiresFactTypes: [], keywords: ["event", "volunteer", "community", "charity", "club", "organis", "organiz", "student"],
      scenarioLabel: "imagined",
      text: "You have written a notice or poster for other people and had to be careful not to promise more than you could deliver. Imagine an assistant writes the poster from a list of facts you give it. The scenario below is fictional.",
      analogyLimit: "For a small notice you can check every line yourself. The brief matters more when the assistant produces many variants faster than you can read them.",
    },
    {
      domain: "general", requiresFactTypes: [], keywords: [],
      scenarioLabel: "imagined",
      text: "Imagine an assistant writes campaign copy for a reusable water bottle from a one-page factsheet. The copy reads well. The question is whether each claim in it can be traced back to a line on that page. The scenario below is fictional.",
      analogyLimit: null,
    },
  ],
  simplerExplanation:
    "A brief is the list of things the assistant is allowed to say and the rules for saying them. For every fact in the brief, write down where it came from. Tell the assistant it may make the words livelier but may not make the facts bigger, and that when the factsheet says nothing about something, it must say so instead of guessing. Style is how it sounds. Support is whether the factsheet says it.",
  deeperExplanation:
    "A campaign brief separates three things that are easy to blur: the evidential constraints (which claims exist, with the exact source wording and any conditions), the stylistic guidance (tone, voice, format) and the behaviour rule for gaps (what the assistant does when the factsheet is silent). A model generates plausible continuations, so an instruction to be persuasive without a claim boundary reliably produces stronger claims than the evidence. Traceability means each claim in the brief maps to a passage; paraphrase is acceptable when the meaning is preserved, so a claim supported by a different passage with different wording still passes. The check that fails is strengthening: turning a survey of 40 into 'everyone', a bench test at one temperature into 'all day', or silence into a feature. The limit of a brief is that it constrains the input, not the output: you still need an evaluation step on what comes back.",
  misconceptions: [
    { id: "style_equals_support", claim: "If the copy is on-brand and reads well, its claims are fine.", repair: "Style and support are different checks. On-brand copy can still state something the factsheet never says. Check each claim against a passage, then check the tone." },
    { id: "strengthen_is_harmless", claim: "Rounding a survey result up, or dropping a test condition, is a harmless simplification.", repair: "The condition and the exact figure are the evidence. '31 of 40 surveyed customers' is not '9 in 10 customers', and 'below 10 °C for 12 hours in a bench test at 22 °C' is not 'ice-cold all day'." },
    { id: "silent_means_allowed", claim: "If the factsheet does not mention something, the assistant can fill it in from what is generally true of such products.", repair: "Silence in the factsheet is a gap, not permission. The brief must tell the assistant to say 'not in the factsheet' or leave the point out." },
    { id: "identical_wording_required", claim: "A claim only counts as supported if it repeats the factsheet word for word.", repair: "Support is about meaning, not identical wording. 'Works without an internet connection' is supported by a passage about downloaded lessons working offline. What is not allowed is a change in strength, scope or condition." },
  ],
  sources: [
    { label: "Fictional factsheet: Ridge 750 bottle", note: "Ridge Outdoor Goods, the Ridge 750 bottle, its bench test and its customer survey are invented for this lesson. Use only the supplied factsheet wording as the source of truth." },
    { label: "Fictional factsheet: Parla language app", note: "Parla and its survey are invented for the transfer task." },
  ],
  blocks: [
    { type: "orientation", id: "b1", text: "This lesson takes about twelve minutes. You will read a one-page factsheet for a fictional product, look at an assistant's first draft brief, find where the draft outgrew the factsheet, and then build a brief of your own where every claim carries its source." },
    {
      type: "example", id: "b2", heading: "The factsheet says",
      text: "Ridge Outdoor Goods sent a factsheet for the Ridge 750 reusable bottle. This is the only evidence the brief may use.",
      sources: [
        { label: "Factsheet line 1 (capacity and material)", text: "Capacity 750 ml. Body made from 18/8 food-grade stainless steel. Lid made from BPA-free polypropylene." },
        { label: "Factsheet line 2 (insulation test)", text: "Double-wall insulated. In an internal bench test at a room temperature of 22 °C, water poured in at 4 °C stayed below 10 °C for 12 hours. Not tested with hot liquids above 60 °C." },
        { label: "Factsheet line 3 (customer survey)", text: "In a survey of 40 customers 30 days after purchase, 31 said they used the bottle on most days." },
        { label: "Factsheet line 4 (care and weight)", text: "Body is dishwasher-safe; lid should be hand-washed. Weight empty: 380 g. Available in three colours." },
      ],
    },
    {
      type: "example", id: "b3", heading: "The assistant's first draft says",
      text: "“Ridge 750: the toughest bottle on the market. Keeps drinks ice-cold all day and hot drinks steaming. Loved by 9 in 10 customers. Fully dishwasher-safe. Made from premium stainless steel.” Four of those five sentences go beyond the factsheet. Only the last is supported, and even that swaps a checkable grade (18/8 food-grade) for a vague word (premium).",
    },
    {
      type: "concept", id: "b4", heading: "Traceable, strengthened, or invented",
      text: "Put each claim in one of three boxes. Traceable: a passage says it, in the same or different words with the same meaning ('750 ml', 'stays below 10 °C for 12 hours in a bench test'). Strengthened: a passage says something weaker or narrower ('31 of 40 surveyed customers' became '9 in 10 customers'; a 12-hour test at one temperature became 'all day'; 'body dishwasher-safe, lid hand-wash' became 'fully dishwasher-safe'). Invented: no passage says anything about it ('toughest on the market', 'hot drinks steaming' when hot liquids were not tested). A brief lists only the first box, and for each claim writes the passage next to it.",
    },
    {
      type: "concept", id: "b5", heading: "Style guidance is not a claim boundary",
      text: "A brief usually says how the copy should sound: warm, plain, playful, short. That is style guidance and the assistant may use it freely. It must be kept separate from the factual constraints, which say what may be claimed and where each claim comes from. Two instructions do most of the work: 'Do not add claims that are not in the approved list, and do not make any claim stronger, broader or less conditional than its source.' And: 'If the factsheet does not cover something you want to say, write [not in factsheet] instead of filling the gap.' Without the second, the assistant treats silence as permission.",
    },
    { type: "interaction", id: "b6", itemFamily: "campaign_brief" },
    { type: "nextStep", id: "b7", text: "With a brief that fixes the claims, the next step is generating variation inside it: different tone, angle and length while the facts stay identical. After that you will compare variants with a rubric and plan a measurement that says what it can and cannot establish." },
  ],
  durationMinutes: [10, 15],
  primaryFamily: "campaign_brief",
  transferFamily: "claims_audit_transfer",
  shortFamily: "quick_claim_source",
  reviewPrompt: "In two sentences: what is the difference between style guidance and a factual constraint in a brief, and what should the assistant do when the factsheet is silent?",
  status: "published",
};
