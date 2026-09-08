import type { Lesson } from "../types";

/**
 * Golden lesson 02: confident output versus supported output.
 * Source: spec/examples/02_GOLDEN_LESSON_EVIDENCE_AND_RETRIEVAL.md. All suppliers are fictional.
 */
export const lessonF04: Lesson = {
  id: "LES-F04-evidence", version: 1, capabilityId: "F04", depth: "apply",
  title: "A good answer needs evidence.",
  outcome: "Tell useful AI output from a convincing guess.",
  prerequisites: [],
  bridges: [
    {
      domain: "supplier_comparison", requiresFactTypes: ["action"], keywords: ["supplier", "bid", "quote", "procure", "vendor", "purchase", "tender"],
      scenarioLabel: "imagined",
      text: "You have compared supplier quotes. Imagine an assistant compares two quotes for you. One answer looks polished and specific. The scenario below is fictional.",
      analogyLimit: "A supplier's promise is a statement you can hold them to. A model's confident sentence is only a prediction of plausible words; it carries no commitment and no source unless one is supplied and checked.",
    },
    {
      domain: "operations", requiresFactTypes: ["action", "role"], keywords: ["operations", "coordinat", "logistic", "schedule", "delivery", "project"],
      scenarioLabel: "imagined",
      text: "You have coordinated work that depends on other people's estimates. Imagine an assistant summarises two delivery estimates for you. The scenario below is fictional.",
      analogyLimit: "A colleague's estimate comes with accountability. A model's estimate is generated text: specific wording is not evidence of a source.",
    },
    {
      domain: "marketing", requiresFactTypes: ["action", "role"], keywords: ["campaign", "marketing", "brand", "audience", "copy", "email"],
      scenarioLabel: "imagined",
      text: "You have approved claims before they went out. Imagine an assistant summarises two supplier quotes for a campaign print run. The scenario below is fictional.",
      analogyLimit: "Brand approval checks tone and style. This check is different: it asks whether each statement is supported by a source at all.",
    },
    {
      domain: "software", requiresFactTypes: ["tool", "role", "action"], keywords: ["python", "api", "software", "developer", "engineer", "code", "http", "web service"],
      scenarioLabel: "imagined",
      text: "You have handled responses from services you did not write. Imagine a model summarises two supplier quotes it was given as context. The scenario below is fictional.",
      analogyLimit: "A 200 status tells you the call succeeded, not that the content is right. The same gap exists between a fluent answer and a supported one.",
    },
    {
      domain: "community", requiresFactTypes: [], keywords: ["event", "volunteer", "community", "spreadsheet", "organis", "organiz", "student"],
      scenarioLabel: "imagined",
      text: "You have compared options when organising something for other people. Imagine an assistant compares two supplier quotes for you. The scenario below is fictional.",
      analogyLimit: "When you compare options yourself you know where each number came from. A model's summary can hide that a number came from nowhere.",
    },
    {
      domain: "general", requiresFactTypes: [], keywords: [],
      scenarioLabel: "imagined",
      text: "Imagine an assistant compares two supplier quotes for a small order. One answer looks polished and specific. The scenario below is fictional.",
      analogyLimit: null,
    },
  ],
  simplerExplanation:
    "Two different questions: Does the sentence sound right? Does something in the source actually say it? A supplier reporting a promise is evidence. An assistant assuming a promise is not. Check every specific word, especially words like guaranteed, always, within and exactly, against the exact wording you were given.",
  deeperExplanation:
    "Language models produce the most plausible continuation of the text they are given. Plausibility is learned from patterns, so specific numbers and confident words appear whether or not the supplied context supports them. Supplying documents helps but does not close the gap: retrieval may miss the relevant passage, retrieve an irrelevant one, or return conflicting material, and generation can still misstate what was retrieved. That is why a reliable workflow needs an evaluation case for missing evidence and an explicit rule for declining to answer.",
  misconceptions: [
    { id: "specific_means_true", claim: "A specific, confident answer is more likely to be correct.", repair: "Specificity is a property of the wording, not of the evidence. Compare each specific claim with the exact source text." },
    { id: "documents_guarantee", claim: "If the assistant was given the documents, its summary must be accurate.", repair: "Supplying documents reduces but does not remove errors. Retrieval can miss or misread, and generation can still overstate." },
    { id: "range_to_point", claim: "Shortening a range to its lower bound is a harmless simplification.", repair: "The range and its conditions are the evidence. A shortened, unconditional figure is a new claim the source does not make." },
  ],
  sources: [{ label: "Fictional supplier quotes", note: "Supplier Elm and Supplier Oak are invented for this lesson. Use only the supplied wording as the source of truth." }],
  blocks: [
    { type: "orientation", id: "b1", text: "This lesson takes about ten minutes. You will read two short source quotes, an AI comparison of them, and decide what the comparison got wrong. Then you will fix it." },
    {
      type: "example", id: "b2", heading: "The sources say",
      text: "Two suppliers sent quotes. Neither offers a delivery guarantee.",
      sources: [
        { label: "Source A (Supplier Elm)", text: "Supplier Elm estimates delivery in 12–15 business days after order confirmation." },
        { label: "Source B (Supplier Oak)", text: "Supplier Oak offers delivery in 10 business days, subject to stock confirmation." },
      ],
    },
    {
      type: "example", id: "b3", heading: "The AI answer says",
      text: "“Choose Elm. Its delivery is guaranteed within 12 days.”",
    },
    {
      type: "concept", id: "b4", heading: "Specificity is not evidence",
      text: "The sentence is fluent and specific. That is exactly the problem: the supplied evidence supports neither the guarantee nor the shortened figure. A supported answer keeps the original range, keeps the conditions (after order confirmation, subject to stock) and says when the sources do not contain an answer. Specificity does not establish correctness.",
    },
    { type: "interaction", id: "b5", itemFamily: "supplier_claims" },
    { type: "nextStep", id: "b6", text: "Once you can spot an unsupported claim, the next capability is deciding what information an assistant needs before it answers." },
  ],
  durationMinutes: [8, 12],
  primaryFamily: "supplier_claims",
  transferFamily: "travel_claims",
  shortFamily: "quick_claim_check",
  reviewPrompt: "In one sentence: what makes a claim in an AI answer supported rather than merely specific?",
  status: "published",
};
