import type { Lesson } from "../types";

/**
 * B01: Diagnose retrieval, synthesis and missing-information failures.
 * Developer-depth branch of golden lesson 02 and UC04 session 1. All documents, products and traces are fictional.
 */
export const lessonB01: Lesson = {
  id: "LES-B01-trace", version: 1, capabilityId: "B01", depth: "analyse",
  title: "Where did the wrong answer come from?",
  outcome: "Read a request, the retrieved snippets and the answer, and attribute a wrong answer to retrieval, synthesis or missing information using evidence from the trace.",
  prerequisites: ["F06"],
  bridges: [
    {
      domain: "software", requiresFactTypes: ["tool", "role", "action"], keywords: ["python", "api", "software", "developer", "engineer", "code", "http", "web service", "backend"],
      scenarioLabel: "imagined",
      text: "You have debugged a service by reading the request, the intermediate calls and the response, rather than guessing from the symptom. Imagine doing the same with a grounded assistant: the request, the snippets the retriever returned, and the answer. The scenario below is fictional.",
      analogyLimit: "In a normal service a 200 with a well-formed body usually means the call did its job. Here the body can be well-formed, cited and wrong, so the trace has to be read for meaning, not just shape.",
    },
    {
      domain: "operations", requiresFactTypes: ["action", "role"], keywords: ["operations", "coordinat", "logistic", "schedule", "delivery", "project", "process"],
      scenarioLabel: "imagined",
      text: "You have traced a wrong delivery back to the step where it went wrong: the wrong order was picked, or the right order was mislabelled, or the item was never in stock. Imagine the same three-way question for an assistant's answer. The scenario below is fictional.",
      analogyLimit: "In a warehouse each step leaves a physical record. In a grounded assistant the only record is the trace, so the diagnosis depends on reading which snippets were retrieved and what the answer did with them.",
    },
    {
      domain: "supplier_comparison", requiresFactTypes: ["action"], keywords: ["supplier", "bid", "quote", "procure", "vendor", "purchase", "tender"],
      scenarioLabel: "imagined",
      text: "You have found that a summary of a quote was wrong and asked whether the summariser had the wrong document, misread the right one, or the quote never said it. Imagine that question asked of an assistant that answers from a document store. The scenario below is fictional.",
      analogyLimit: "With a human summariser you can ask what they read. With an assistant you can only look at the retrieved snippets and compare them with the answer, which is exactly what this lesson practises.",
    },
    {
      domain: "leadership", requiresFactTypes: ["role"], keywords: ["lead", "manager", "director", "founder", "head of", "ceo", "owner"],
      scenarioLabel: "imagined",
      text: "You have been told 'the assistant gave a wrong answer' and had to decide what to fund: better documents, a different model, or a rule for saying no. Imagine reading one trace well enough to know which. The scenario below is fictional.",
      analogyLimit: "One trace tells you the failure class for that case. Deciding what to invest in needs a set of traces, which is what the evaluation-set capability builds next.",
    },
    {
      domain: "research", requiresFactTypes: [], keywords: ["research", "experiment", "study", "statistic", "data", "analysis", "phd", "thesis"],
      scenarioLabel: "imagined",
      text: "You have checked a citation and found the cited paper does not say what the sentence claims. Imagine that same check on an assistant's answer, where the citation points at a paragraph it retrieved. The scenario below is fictional.",
      analogyLimit: "A wrong citation in a paper is usually an author error. In a grounded assistant it can come from the retriever handing over the wrong paragraph, from the generator misreading the right one, or from the corpus never containing the answer, and each needs a different fix.",
    },
    {
      domain: "general", requiresFactTypes: [], keywords: [],
      scenarioLabel: "imagined",
      text: "Imagine an assistant that answers questions from a company's own documents. It gives a confident answer with a citation, and the answer is wrong. Before fixing anything, you need to know which step failed. The scenario below is fictional.",
      analogyLimit: null,
    },
  ],
  simplerExplanation:
    "An assistant that answers from documents does two things: it finds some passages, then it writes an answer from them. So a wrong answer can come from three places. It found the wrong passages. It found the right passage but misread it. Or the documents never contained the answer and it should have said so. You tell them apart by looking at the passages it found: are they about the question, and do they actually say what the answer says? A reply that arrives without an error and reads well can still be wrong in any of those three ways.",
  deeperExplanation:
    "A grounded (retrieval-augmented) pipeline has a retrieval stage that selects passages from a corpus and a synthesis stage that generates an answer conditioned on them. Failures separate into three classes with distinct signals. Retrieval failure: a relevant passage exists in the corpus but the retrieved set does not contain it; the signal is retrieved snippets that do not address the question's subject, and the fix lies in indexing, chunking, query formulation or ranking. Synthesis failure: the retrieved set contains the passage that answers the question, but the answer misstates it (wrong figure, dropped condition, wrong citation, merged facts); the signal is a mismatch between the answer and a retrieved snippet that was available, and the fix lies in prompting, output constraints and post-generation grounding checks. Missing information: the corpus contains no passage that answers the question; the correct behaviour is to say the documents do not cover it or to ask, and the failure is filling the gap with a plausible answer, often by borrowing a figure from an unrelated passage. Distinguishing retrieval failure from missing information requires checking the corpus, not just the trace. Transport-level success (a 200 status, valid JSON, a citation present) is orthogonal to all three: it says the call completed, not that the content is right.",
  misconceptions: [
    { id: "status_means_correct", claim: "A 200 response with a well-formed, cited answer means the pipeline worked.", repair: "Status and format say the call completed. Correctness is a separate check: compare the answer with the retrieved snippets and with the question." },
    { id: "citation_means_support", claim: "If the answer cites a passage, it is grounded in that passage.", repair: "A citation is a pointer, not proof. Read the cited passage and check it actually says what the answer says about the thing the question asked." },
    { id: "retrieval_fixes_everything", claim: "If the right passage is retrieved, the answer will be right.", repair: "Synthesis can still misstate a correct passage: change a number, drop a condition or merge two facts. Retrieval quality is necessary, not sufficient." },
    { id: "blame_the_model_always", claim: "Every wrong answer is the model hallucinating, so the fix is always a better prompt.", repair: "Classify first. A retrieval failure needs indexing or query work, a synthesis failure needs prompt or grounding checks, and missing information needs corpus coverage plus a rule for declining. The wrong fix wastes the effort." },
  ],
  sources: [
    { label: "Fictional documents and traces", note: "Bramble Bikes, Northway Home, the Willowbank Leisure Centre handbook and the Halden staff handbook are invented. Their policy text exists only in these exercises." },
  ],
  blocks: [
    { type: "orientation", id: "b1", text: "This lesson takes about twelve minutes. You will read one trace from a fictional document assistant: the request, the two snippets the retriever returned, and the answer. You will work out which stage failed and what evidence in the trace shows it, then do the same on a fresh trace." },
    {
      type: "example", id: "b2", heading: "The trace",
      text: "Bramble Bikes, a fictional retailer, runs an assistant over its warranty and manual documents. A customer asks about the e-bike battery.",
      sources: [
        { label: "Request", text: "Does the warranty cover the battery on the Bramble Ridgeline e-bike?" },
        { label: "Retrieved snippet [1] (Warranty, section 2)", text: "The frame of every Bramble bicycle is covered against manufacturing defects for five years from the date of purchase." },
        { label: "Retrieved snippet [2] (Ridgeline manual, page 14)", text: "Charge the battery fully before first use. Store between 10 °C and 25 °C when not in use for more than two weeks." },
        { label: "Answer (HTTP 200)", text: "Yes. The battery on the Ridgeline is covered for five years from purchase [1]." },
      ],
    },
    {
      type: "concept", id: "b3", heading: "Three places a wrong answer can come from",
      text: "Read the snippets before the answer. Neither is about battery warranty: [1] is about the frame, [2] is about charging. So the answer's 'five years' was borrowed from a passage about something else. That rules out a pure synthesis failure, where the right passage is present and misstated. It leaves two candidates. Retrieval failure: the warranty document has a battery clause and the retriever did not return it. Missing information: the documents never say anything about battery warranty, and the correct answer was 'the documents do not cover this'. The trace alone cannot separate those two; you separate them by checking the corpus. Either way the answer is wrong, and either way the synthesis stage also did something it should not: it answered confidently from passages that did not address the question.",
    },
    {
      type: "concept", id: "b4", heading: "Signals for each class, and why 200 is not an answer",
      text: "Retrieval failure signal: the retrieved snippets are not about the subject of the question, and the corpus does contain a relevant passage. Synthesis failure signal: a retrieved snippet does answer the question, but the answer's figure, condition or citation does not match it. Missing information signal: no retrieved snippet and no corpus passage answers the question, and the assistant answered anyway. Each has a different fix, so the classification comes first. The HTTP status, the JSON shape and the presence of a citation are transport and format checks. They tell you the call completed. Here the call completed perfectly and the answer was wrong, so correctness has to be checked against the snippets and the question, every time.",
    },
    { type: "interaction", id: "b5", itemFamily: "trace_diagnosis" },
    { type: "nextStep", id: "b6", text: "Once you can name the failure class from a trace, you can write the test that would have caught it. The next capability turns traces like these into a versioned evaluation set with normal, missing-source and conflicting-source cases." },
  ],
  durationMinutes: [10, 15],
  primaryFamily: "trace_diagnosis",
  transferFamily: "trace_transfer_synthesis",
  shortFamily: "quick_status_vs_correct",
  reviewPrompt: "In two sentences: what in a trace tells you a wrong answer came from synthesis rather than retrieval, and what does a 200 status tell you about the answer?",
  status: "published",
};
