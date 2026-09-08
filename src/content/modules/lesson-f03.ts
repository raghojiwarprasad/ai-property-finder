import type { Lesson } from "../types";

/**
 * F03: the four parts of a task brief. Suppliers, policies and briefs are fictional.
 */
export const lessonF03: Lesson = {
  id: "LES-F03-brief", version: 1, capabilityId: "F03", depth: "apply",
  title: "A brief the assistant cannot misread.",
  outcome: "Write a task brief that names the task, the supplied context, the constraints including which sources may be used and what to do when they are silent, and the required output.",
  prerequisites: ["F04"],
  bridges: [
    {
      domain: "supplier_comparison", requiresFactTypes: ["action"], keywords: ["supplier", "bid", "quote", "procure", "vendor", "purchase", "tender"],
      scenarioLabel: "imagined",
      text: "You have compared supplier quotes and know that the useful comparison depends on asking the right question of each quote. Imagine writing the instructions for an assistant that will do that comparison for you. The scenario below is fictional.",
      analogyLimit: "A colleague you brief will ask when something is missing from a quote. An assistant will not unless the brief tells it to; the silence rule has to be written down.",
    },
    {
      domain: "operations", requiresFactTypes: ["action", "role"], keywords: ["operations", "coordinat", "logistic", "schedule", "delivery", "project"],
      scenarioLabel: "imagined",
      text: "You have handed a task to someone with a short note and watched what happened when the note left something out. Imagine writing that note for an assistant comparing two quotes. The scenario below is fictional.",
      analogyLimit: "A person fills a gap in a note by asking or by using judgement they can explain. An assistant fills it with plausible text, so every gap in the brief becomes a place where something can be invented.",
    },
    {
      domain: "marketing", requiresFactTypes: ["action", "role"], keywords: ["campaign", "marketing", "brand", "audience", "copy", "email"],
      scenarioLabel: "imagined",
      text: "You have written creative briefs and know that a vague brief produces work that misses. Imagine a brief for an assistant comparing two print suppliers' quotes. The scenario below is fictional.",
      analogyLimit: "A creative brief leaves room for interpretation on purpose. This kind of brief does the opposite for facts: it closes the room, naming the only sources allowed and what to do when they do not answer.",
    },
    {
      domain: "software", requiresFactTypes: ["tool", "role", "action"], keywords: ["python", "api", "software", "developer", "engineer", "code", "http", "web service"],
      scenarioLabel: "imagined",
      text: "You have written a function signature and a docstring that say what goes in, what comes out and what happens on bad input. Imagine doing the same for a model asked to compare two quotes. The scenario below is fictional.",
      analogyLimit: "A function's contract is enforced by types and tests. A brief is enforced by nothing but its wording and later checking, so the unknown-state rule must be explicit rather than assumed.",
    },
    {
      domain: "community", requiresFactTypes: [], keywords: ["event", "volunteer", "community", "spreadsheet", "organis", "organiz", "student"],
      scenarioLabel: "imagined",
      text: "You have asked a helper to compare options for something you were organising and found that how you asked shaped what you got back. Imagine writing the request for an assistant comparing two quotes. The scenario below is fictional.",
      analogyLimit: "A helper who does not know an answer will usually say so. An assistant needs to be told to say so, or it will produce an answer-shaped sentence instead.",
    },
    {
      domain: "general", requiresFactTypes: [], keywords: [],
      scenarioLabel: "imagined",
      text: "Imagine writing the instructions for an assistant that will compare two supplier quotes for a small order. The scenario below is fictional.",
      analogyLimit: null,
    },
  ],
  simplerExplanation:
    "A brief has four parts. Task: what to do. Context: what you are giving it to work from. Constraints: what it may and may not use, and what to write when the material does not contain the answer. Output: what shape the result should have. The part people forget is the silence rule: if you do not say 'write not stated when the quote does not say', the assistant will fill the gap with something that sounds right.",
  deeperExplanation:
    "A task brief is the input contract for a generation step. The task fixes the objective; the context fixes the material the model may condition on; the constraints fix source boundaries and the behaviour required when the material is insufficient, conflicting or silent; the output specification fixes the form so the result can be checked mechanically. Of the four, the constraints do most of the work against unsupported claims, because a model completes gaps with plausible text by default. A brief that specifies format but not sources produces well-shaped output whose facts may come from anywhere; a brief that restricts sources but has no unknown-state rule still invites the model to answer from the nearest passage. Neither a longer brief nor a friendlier tone substitutes for these two constraints. Each part should be testable: you should be able to look at an output and say which part of the brief it violated.",
  misconceptions: [
    { id: "more_words_better", claim: "A longer, more detailed brief is automatically a better brief.", repair: "Length is not the measure. A brief is good when each of its four parts is present and checkable; extra adjectives about quality do not restrict where facts come from." },
    { id: "model_knows_sources", claim: "The assistant will naturally use only the documents I attach.", repair: "Unless the brief says which sources are allowed, the model will draw on patterns from anywhere, including general knowledge that does not apply to your case. Name the supplied sources as the only allowed sources." },
    { id: "format_is_enough", claim: "If I specify the output format precisely, the answer will be reliable.", repair: "Format controls the shape of the answer, not where its facts come from. A perfect table can be full of invented cells." },
    { id: "silence_means_no", claim: "If the source does not mention something, the assistant will say so on its own.", repair: "By default the model produces an answer-shaped sentence for every question. Tell it exactly what to write when the source is silent, such as 'not stated in the quote'." },
  ],
  sources: [{ label: "Fictional supplier quotes", note: "Supplier Birch and Supplier Rowan, their quotes and both briefs are invented for this lesson. Use only the supplied wording." }],
  blocks: [
    { type: "orientation", id: "b1", text: "This lesson takes about twelve minutes. You will read a weak brief, see what an assistant did with it, learn the four parts every brief needs, and then rewrite the brief so it can be reused." },
    {
      type: "example", id: "b2", heading: "The weak brief and what it produced",
      text: "Someone pasted two quotes and wrote one line of instruction. Look at what the answer did with the lead time Rowan never gave.",
      sources: [
        { label: "Quote from Supplier Birch", text: "Unit price 4.20 for orders above 500 units. Lead time three weeks from receipt of deposit." },
        { label: "Quote from Supplier Rowan", text: "Unit price 3.95. Minimum order 1,000 units. Lead time not given in the quote." },
        { label: "Weak brief", text: "Look at the two quotes and tell me which supplier is best and how quickly they can deliver." },
        { label: "AI answer", text: "Rowan is the better choice: it is cheaper at 3.95 and can typically deliver within two weeks, against three weeks for Birch." },
      ],
    },
    {
      type: "concept", id: "b3", heading: "The four parts",
      text: "Task: what exactly to do (compare price and lead time; do not recommend). Context: what is supplied (the two quotes, pasted in full). Constraints: which sources may be used (only the two quotes), what to keep (conditions such as 'above 500 units' and 'minimum order 1,000'), and what to do when a quote is silent (write 'not stated in the quote'; do not estimate). Output: the form (a table with one row per supplier and named columns, plus a line listing anything not stated). The weak brief had a task and nothing else, so the assistant chose its own sources, invented 'typically within two weeks' and decided 'best' meant cheapest.",
    },
    {
      type: "example", id: "b4", heading: "The repaired brief",
      text: "The same request with all four parts. Notice that the silence rule turns Rowan's missing lead time into a visible gap instead of an invented number.",
      sources: [
        { label: "Repaired brief", text: "Task: compare the two supplier quotes on unit price and lead time. Do not recommend a supplier. Context: the two quotes pasted below are the only material. Constraints: use only the two quotes. Keep every condition as written (the 500-unit price condition, the minimum order, lead time counted from deposit). If a quote does not state something, write 'not stated in the quote' and do not estimate it. Output: a table with one row per supplier and columns for unit price, price conditions, lead time, minimum order; then one line listing anything not stated." },
      ],
    },
    {
      type: "concept", id: "b5", heading: "Why the silence rule matters most",
      text: "Of the four parts, the one most often missing is the instruction for when the source does not contain the answer. Without it, the model does what it always does: writes the sentence that usually follows. 'Typically within two weeks' is that sentence. With it, the gap becomes something you can see and follow up with Rowan. A brief that names the task and the format but not the sources or the silence rule produces tidy output with untraceable facts.",
    },
    { type: "interaction", id: "b6", itemFamily: "brief_repair" },
    { type: "nextStep", id: "b7", text: "You now have a brief you can reuse for the next comparison. The next capability looks at what happens when an assistant is given documents to retrieve from, and what that does and does not guarantee." },
  ],
  durationMinutes: [10, 14],
  primaryFamily: "brief_repair",
  transferFamily: "brief_transfer_support",
  shortFamily: "quick_brief_check",
  reviewPrompt: "Name the four parts of a task brief and say which one stops the assistant filling a gap with a plausible guess.",
  status: "published",
};
