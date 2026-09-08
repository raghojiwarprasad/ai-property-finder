import type { Lesson } from "../types";

/**
 * F02: why a model can sound sure and be wrong.
 * All products, organisations and answers below are fictional.
 */
export const lessonF02: Lesson = {
  id: "LES-F02-uncertainty", version: 1, capabilityId: "F02", depth: "explain",
  title: "Sounding sure is not the same as knowing.",
  outcome: "Explain why a fluent, specific answer can be unsupported, and spot the words that signal certainty nothing backs up.",
  prerequisites: [],
  bridges: [
    {
      domain: "supplier_comparison", requiresFactTypes: ["action"], keywords: ["supplier", "bid", "quote", "procure", "vendor", "purchase", "tender"],
      scenarioLabel: "imagined",
      text: "You have read supplier replies where the confident ones were not always the reliable ones. Imagine asking an assistant about a product's warranty when it has not been given the warranty document. The scenario below is fictional.",
      analogyLimit: "A supplier who overstates can be held to what they wrote. A model's confident sentence is only a likely continuation of text; there is no one behind it who checked anything.",
    },
    {
      domain: "operations", requiresFactTypes: ["action", "role"], keywords: ["operations", "coordinat", "logistic", "schedule", "delivery", "project"],
      scenarioLabel: "imagined",
      text: "You have worked with estimates that people gave more firmly than the facts allowed. Imagine an assistant giving you a firm warranty period without ever seeing the warranty. The scenario below is fictional.",
      analogyLimit: "A colleague's firm estimate usually rests on some experience. A model's firm figure rests on word patterns; it can be entirely disconnected from the product in question.",
    },
    {
      domain: "leadership", requiresFactTypes: ["role"], keywords: ["lead", "manager", "director", "head of", "founder", "ceo", "board", "strategy"],
      scenarioLabel: "imagined",
      text: "You have had to tell a confident report from a well-founded one. Imagine an assistant answering a warranty question with total confidence and no source. The scenario below is fictional.",
      analogyLimit: "A confident person can be asked where a claim came from and usually has an answer. A model has no memory of a source for any particular sentence, so the question must be answered by checking the text yourself.",
    },
    {
      domain: "software", requiresFactTypes: ["tool", "role", "action"], keywords: ["python", "api", "software", "developer", "engineer", "code", "http", "web service"],
      scenarioLabel: "imagined",
      text: "You have seen a function return a well-formed value that was still wrong. Imagine a model returning a well-formed warranty answer it had no data for. The scenario below is fictional.",
      analogyLimit: "A wrong return value usually traces to a bug you can find. A model's unsupported sentence is not a bug in that sense: producing plausible text is exactly what it was built to do.",
    },
    {
      domain: "research", requiresFactTypes: ["subject", "action"], keywords: ["research", "study", "experiment", "thesis", "paper", "dataset", "analysis", "statistic"],
      scenarioLabel: "imagined",
      text: "You have read a claim and asked what the evidence for it was. Imagine an assistant stating a warranty period as if it were a measured fact. The scenario below is fictional.",
      analogyLimit: "In a paper the method section tells you where a number came from. A model's answer has no method section; the number may have no origin at all.",
    },
    {
      domain: "general", requiresFactTypes: [], keywords: [],
      scenarioLabel: "imagined",
      text: "Imagine asking an assistant how long the warranty on a small appliance lasts, without giving it the warranty leaflet. The scenario below is fictional.",
      analogyLimit: null,
    },
  ],
  simplerExplanation:
    "A language model writes the words that usually come next. It does not look anything up unless you give it something to look at. So it can write 'guaranteed for three years' in the same confident voice whether or not anything says so. Watch for words like guaranteed, always, exactly, every and never. An honest answer says what it does not know and tells you where to check.",
  deeperExplanation:
    "A language model generates the most plausible continuation of its input, token by token, using patterns learned from large amounts of text. Nothing in that process consults a source unless one is placed in the input. Confident phrasing is a learned style, not a measure of evidence: the model has no internal signal that separates a sentence it produced from a passage it was given. That is why specific numbers and absolute words can appear with no backing. An honest response separates what the input supports from what it does not, states the unknown explicitly, and names what would settle the question. This does not make the model useless; it means certainty in the wording must be checked against evidence outside the wording.",
  misconceptions: [
    { id: "fluent_means_known", claim: "If the answer is written confidently and clearly, the model must have found the fact somewhere.", repair: "The model has no built-in source. It produces the likeliest continuation of the text, and confident phrasing is part of what makes text likely. Ask what the answer was given, not how it sounds." },
    { id: "numbers_are_lookups", claim: "A specific number or date means the model looked it up.", repair: "Specific figures are common in the text a model learned from, so it produces them readily. A number is only supported when something you supplied says it." },
    { id: "hedging_means_weak", claim: "An answer that says 'I don't know' is worse than one that gives a definite figure.", repair: "An answer that names the gap and points to where to check is more useful than a definite figure with no backing, because you can act on it without being misled." },
    { id: "certainty_is_calibrated", claim: "The model's confident tone shows how sure it actually is.", repair: "Tone is copied from how people write, not measured from evidence. A model can be equally fluent about a fact it was given and about one it invented." },
  ],
  sources: [{ label: "Fictional appliance warranty", note: "The Fennwick heater, the Harrowgate museum and every answer quoted in this lesson are invented. No real product's terms are described." }],
  blocks: [
    { type: "orientation", id: "b1", text: "This lesson takes about ten minutes. You will read a confident answer to a warranty question, find the words that carry unsupported certainty, and see what an honest answer would have done instead." },
    {
      type: "example", id: "b2", heading: "The question and the answer",
      text: "A customer asks an assistant about a heater. Nothing else was supplied: no leaflet, no product page, no seller's terms.",
      sources: [
        { label: "Question", text: "How long is the warranty on the Fennwick H3 heater, and what does it cover?" },
        { label: "AI answer (no source supplied)", text: "The Fennwick H3 is guaranteed for exactly three years. The warranty always covers the heating element and the thermostat, and replacement units are shipped within five working days." },
      ],
    },
    {
      type: "concept", id: "b3", heading: "Where the words come from",
      text: "The model was given a question and nothing else. It produced the kind of sentence that usually follows such a question: a period, a list of covered parts, a shipping promise. Every detail is plausible for a heater. None of it comes from the Fennwick H3's terms, because the model never saw them. A plausible continuation is what the model is built to produce; that is not the same as a fact it found.",
    },
    {
      type: "concept", id: "b4", heading: "Certainty signals",
      text: "Some words assert more than the evidence could support even if a leaflet had been supplied: guaranteed, always, exactly, every, never, definitely, in all cases. When you see one, ask what in the supplied material says it. Here nothing was supplied, so every one of them is unsupported. The same words in a sentence that quotes the leaflet would be fine.",
    },
    {
      type: "concept", id: "b5", heading: "What an honest answer does",
      text: "It says what it does not have: 'I do not have the Fennwick H3 warranty terms.' It separates general knowledge from the specific case: 'Small heaters are often sold with one to three years of cover, but the H3's period is not something I can confirm.' It names what would settle it: 'Check the leaflet or the seller's page, or paste the terms and I will summarise them.' It is shorter, less impressive and far more useful.",
    },
    { type: "interaction", id: "b6", itemFamily: "certainty_signals" },
    { type: "nextStep", id: "b7", text: "Once you can hear certainty that nothing supports, the next step is checking claims against supplied sources and saying what the assistant should do when the source is silent." },
  ],
  durationMinutes: [8, 12],
  primaryFamily: "certainty_signals",
  transferFamily: "uncertainty_transfer",
  shortFamily: "quick_certainty",
  reviewPrompt: "In one sentence: why can an answer be fluent and specific and still have nothing behind it?",
  status: "published",
};
