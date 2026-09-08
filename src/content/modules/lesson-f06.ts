import type { Lesson } from "../types";

/**
 * F06: what retrieval does and what it cannot guarantee.
 * Developer-depth point from spec/examples/02_GOLDEN_LESSON_EVIDENCE_AND_RETRIEVAL.md.
 * The pool, its rules and the assistant trace are fictional.
 */
export const lessonF06: Lesson = {
  id: "LES-F06-retrieval", version: 1, capabilityId: "F06", depth: "explain",
  title: "Giving it the documents is not the same as getting the answer.",
  outcome: "Explain what retrieval does, what supplying documents does and does not guarantee, and tell a retrieval failure from a generation failure in a supplied trace.",
  prerequisites: ["F04"],
  bridges: [
    {
      domain: "software", requiresFactTypes: ["tool", "role", "action"], keywords: ["python", "api", "software", "developer", "engineer", "code", "http", "web service"],
      scenarioLabel: "imagined",
      text: "You have called a search endpoint and got results back that matched the words but not the intent. Imagine an assistant whose answers are built on exactly that kind of result. The scenario below is fictional.",
      analogyLimit: "A search result you inspect yourself is a list you can judge. Here the model reads the list and writes a sentence, so a wrong result can turn into a confident answer before anyone sees it.",
    },
    {
      domain: "operations", requiresFactTypes: ["action", "role"], keywords: ["operations", "coordinat", "logistic", "schedule", "delivery", "project"],
      scenarioLabel: "imagined",
      text: "You have looked something up in a folder of documents and pulled the wrong version. Imagine an assistant doing that lookup for you and answering from what it found. The scenario below is fictional.",
      analogyLimit: "When you pull the wrong document you usually notice the date on it. Retrieval matches wording, not dates or intent, and the answer step does not check which document it was handed.",
    },
    {
      domain: "supplier_comparison", requiresFactTypes: ["action"], keywords: ["supplier", "bid", "quote", "procure", "vendor", "purchase", "tender"],
      scenarioLabel: "imagined",
      text: "You have searched a stack of quotes for one clause and found the phrase in the wrong quote. Imagine an assistant given the whole stack and asked a question about one clause. The scenario below is fictional.",
      analogyLimit: "You know which quote you are reading. The assistant is handed passages without that awareness, and a similar-sounding passage from the wrong document looks just as good to it.",
    },
    {
      domain: "research", requiresFactTypes: ["subject", "action"], keywords: ["research", "study", "experiment", "thesis", "paper", "dataset", "analysis", "statistic"],
      scenarioLabel: "imagined",
      text: "You have searched a literature database and got papers that shared your keywords but not your question. Imagine an assistant answering from the top results of such a search. The scenario below is fictional.",
      analogyLimit: "You can read an abstract and discard it. The assistant conditions its answer on whatever was retrieved, relevant or not, unless it has been told to say when nothing fits.",
    },
    {
      domain: "community", requiresFactTypes: [], keywords: ["event", "volunteer", "community", "spreadsheet", "organis", "organiz", "student"],
      scenarioLabel: "imagined",
      text: "You have searched old messages or newsletters for one rule and found a sentence that sounded right but was about something else. Imagine an assistant doing that search for a community pool. The scenario below is fictional.",
      analogyLimit: "You notice when the sentence is about a different thing. Retrieval scores similarity of wording, so 'refund' in the wrong section can outrank the right section that uses different words.",
    },
    {
      domain: "general", requiresFactTypes: [], keywords: [],
      scenarioLabel: "imagined",
      text: "Imagine an assistant that answers questions about a community pool's rules by first finding passages in the pool's documents and then writing an answer from them. The scenario below is fictional.",
      analogyLimit: null,
    },
  ],
  simplerExplanation:
    "Retrieval is a search step. Before the model answers, a search finds a few passages from your documents that look similar to the question and hands them to the model. That helps, but it promises nothing on its own: the search can miss the right passage, pick a passage that only sounds related, or return two passages that disagree. And the model can still write something the passage does not say. So when an answer is wrong, ask two questions: was the right passage found, and did the model use it properly?",
  deeperExplanation:
    "Retrieval-augmented generation splits answering into two stages. First, the request is matched against chunks of a document store, usually by similarity of wording or embeddings, and the top few chunks are placed in the model's input. Second, the model generates an answer conditioned on the request plus those chunks. Retrieval guarantees only that some chunks were supplied; it does not guarantee that the relevant chunk was among them, that irrelevant or stale chunks were excluded, or that conflicting chunks were reconciled. Ranking is by similarity, not by whether a chunk answers the question or by its date. Generation then adds its own failure mode: the model can cite the wrong chunk, blend chunks, or overstate what a chunk says. A third case is that the information is not in the store at all, in which case a correct system says so. Supplying documents therefore reduces unsupported answers but does not eliminate them, and it does not eliminate hallucination. A reliable workflow needs an evaluation case for missing evidence, an evaluation case for conflicting evidence, and an explicit rule for declining to answer when nothing retrieved supports one.",
  misconceptions: [
    { id: "retrieval_guarantees_truth", claim: "If the assistant has the documents, its answer must come from them and must be right.", repair: "Having the documents means passages can be supplied. Retrieval can miss or pick the wrong passage, and generation can still misstate the passage it was given." },
    { id: "citation_means_support", claim: "A citation proves the answer is supported.", repair: "A citation points at a passage. Whether the passage says what the answer says is a separate check; the lesson's example cites a real passage that is about something else." },
    { id: "similar_means_relevant", claim: "Retrieval returns the passage that answers the question.", repair: "Retrieval returns passages whose wording is similar to the question. Shared words such as 'refund' and 'cancel' can come from the wrong section entirely." },
    { id: "more_documents_fix_it", claim: "Adding more documents makes the answers more reliable.", repair: "More documents mean more passages competing for the top spots, more stale versions and more chances of conflict. Reliability comes from evaluation and a decline rule, not from volume." },
  ],
  sources: [{ label: "Fictional pool documents", note: "The Wrenfield Community Pool, its cancellation rules and the assistant's answer are invented for this lesson. Use only the supplied wording." }],
  blocks: [
    { type: "orientation", id: "b1", text: "This lesson takes about ten minutes. You will see what a retrieval step actually hands the model, watch an answer cite the wrong passage, and learn the three questions to ask when a grounded assistant gets something wrong." },
    {
      type: "concept", id: "b2", heading: "What retrieval does",
      text: "A grounded assistant does not read all your documents each time. When a question arrives, a search finds a handful of passages whose wording looks similar to the question and hands only those to the model. The model then writes an answer from the question plus those passages. Everything the model 'knows' about your documents at that moment is in that handful.",
    },
    {
      type: "example", id: "b3", heading: "A request, two passages and an answer",
      text: "A member asks the Wrenfield Community Pool's assistant about cancelling a lane hire. Two passages were retrieved. Read both before reading the answer.",
      sources: [
        { label: "Request", text: "How many days before a lane-hire booking can I cancel and still get a full refund?" },
        { label: "Retrieved passage 1 (lessons_terms.pdf)", text: "Swimming lessons: a full refund is available if a block of lessons is cancelled at least 14 days before the first lesson." },
        { label: "Retrieved passage 2 (lane_hire_terms.pdf)", text: "Lane hire: bookings cancelled at least 3 days before the booked session are refunded in full. Later cancellations are charged at 50%." },
        { label: "AI answer", text: "You can cancel up to 14 days before and receive a full refund [lessons_terms.pdf]." },
      ],
    },
    {
      type: "concept", id: "b4", heading: "What went wrong, and where",
      text: "Retrieval did part of its job: the relevant passage (lane hire, 3 days) was found. It also returned an irrelevant one that shares the words 'full refund' and 'cancelled'. The answer step then used the irrelevant passage and cited it. The citation is real, and the answer is wrong. Had only passage 1 been retrieved, the failure would have been in retrieval instead; had neither document mentioned lane hire, the right answer would have been 'not stated in the documents'. Three places, three different fixes.",
    },
    {
      type: "concept", id: "b5", heading: "What supplying documents guarantees",
      text: "By itself, nothing. Retrieval may miss the relevant passage, retrieve an irrelevant or out-of-date one, or return two that conflict; ranking is by similarity of wording, not by whether a passage answers the question. Generation can then cite the wrong passage, blend passages, or overstate one. Supplying documents narrows the gap between a fluent answer and a supported one; it does not close it. That is why a grounded assistant needs a rule for declining to answer when nothing retrieved supports one, and evaluation cases for missing and conflicting evidence.",
    },
    { type: "interaction", id: "b6", itemFamily: "retrieval_trace_explain" },
    { type: "nextStep", id: "b7", text: "You can now say whether a wrong answer came from the search or from the writing. The next capability is deciding when an assistant may act on its own answer and when a person must approve." },
  ],
  durationMinutes: [8, 12],
  primaryFamily: "retrieval_trace_explain",
  transferFamily: "retrieval_transfer_operations",
  shortFamily: "quick_retrieval",
  reviewPrompt: "In two sentences: what does supplying documents to an assistant guarantee, and what are the two places an answer can still go wrong?",
  status: "published",
};
