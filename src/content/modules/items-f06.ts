import type { ItemFamily, Rubric } from "../types";

/** Rubric for reading a retrieval trace (software domain). */
export const rubricRetrievalTrace: Rubric = {
  id: "RUB-F06-retrieval-trace", version: 1, supportingRequired: 1,
  criteria: [
    { id: "R1", label: "Identifies the relevant snippet (limits.md, per minute) and the irrelevant one the answer used (billing.md)", critical: true,
      cues: ["limits.md", "limits", "snippet b", "second snippet", "per minute", "every minute", "each minute", "600", "billing.md", "billing", "snippet a", "first snippet", "wrong snippet", "wrong passage", "wrong source", "wrong document", "irrelevant", "not relevant", "unrelated", "about invoices", "invoices", "invoice", "cited the wrong", "cites the wrong", "picked the wrong", "used the wrong", "chose the wrong", "pick the wrong"],
      antiCues: ["resets every hour is correct", "every hour is right", "every hour is correct", "billing.md is the right", "billing.md is correct", "the answer is correct", "answer is right", "correctly cites", "correctly cited", "hourly reset is correct"] },
    { id: "R2", label: "Attributes the failure to generation, since the right passage was retrieved", critical: true,
      cues: ["generation", "generat", "synthesis", "synthes", "the model", "the answer step", "answer step", "writing the answer", "writing step", "not retrieval", "retrieval worked", "retrieval did its job", "retrieval was fine", "retrieval is fine", "retrieval found", "retrieval got", "was retrieved", "were retrieved", "did retrieve", "retrieved the right", "retrieved both", "both were", "both snippet", "both passages", "the right passage was there", "right passage was there", "correct passage was there", "correct passage was retrieved", "right snippet was there", "had the right", "had the correct", "ignored", "misread", "mis-read", "picked", "chose", "pick the", "selected the", "not a retrieval problem", "not a retrieval failure", "not retrieval failure", "wasn't retrieval", "wasnt retrieval", "isn't retrieval", "not the retrieval", "problem is the model", "fault is the model", "model's fault", "models fault"],
      antiCues: ["retrieval missed the", "failed to retrieve", "the docs don't say", "the docs do not say", "documentation does not say", "documentation doesn't say", "information is missing from the docs", "not in the documents", "not in the docs", "more documents would fix", "needs more documentation", "needs more documents", "given more documentation"] },
    { id: "R3", label: "Says what the answer should have done: per minute, citing limits.md", critical: false,
      cues: ["should have", "should say", "should cite", "should quote", "should use", "should answer", "should have said", "correct answer", "right answer", "every minute", "per minute", "each minute", "start of each minute", "cite limits", "quote limits", "from limits.md", "use snippet b", "use the second", "point to limits", "answer should", "answer is: the limit resets", "resets each minute"],
      antiCues: [] },
    { id: "R4", label: "Names the decline rule or a check that the cited passage answers the question", critical: false,
      cues: ["not stated", "unknown", "say it cannot", "say it can't", "say it cant", "decline", "refuse", "not answer", "not enough", "ask for", "flag", "check", "evaluation case", "test case", "eval", "verify", "does the passage actually", "only cite", "only answer from", "answer only from", "if no passage", "if no retrieved", "if nothing relevant", "if none of the snippets", "if the snippets don't", "if the snippets do not", "say so", "no relevant passage", "nothing relevant"],
      antiCues: [] },
  ],
};

/** Rubric for the operations transfer: wrong month's schedule retrieved. */
export const rubricRetrievalTransferOperations: Rubric = {
  id: "RUB-F06-retrieval-transfer-operations", version: 1, supportingRequired: 1,
  criteria: [
    { id: "O1", label: "Identifies that the retrieved passage was from the wrong week (July), so the answer is wrong", critical: true,
      cues: ["july", "wrong month", "wrong week", "old schedule", "out of date", "out-of-date", "outdated", "stale", "previous schedule", "earlier schedule", "week 31", "not the current", "not current", "wrong schedule", "wrong document", "wrong file", "wrong period", "from the wrong", "not next week", "different week", "different month", "past schedule", "old week", "old file", "not september", "months old", "weeks old"],
      antiCues: ["tuesday and friday is correct", "tuesday and friday is right", "the answer is correct", "the answer is right", "answer is fine", "correctly answered", "answer is accurate", "same every week so"] },
    { id: "O2", label: "Attributes the failure to retrieval: the current schedule existed but was not retrieved", critical: true,
      cues: ["retrieval", "retrieve", "retrieved", "search", "searched", "found the", "did not find", "didn't find", "didnt find", "not found", "wasn't found", "was not found", "wasnt found", "picked up", "pulled", "fetched", "matched", "match", "similar", "similarity", "same words", "keyword", "not retrieved", "wasn't retrieved", "was not retrieved", "wasnt retrieved", "never retrieved", "missed", "miss", "lookup", "looked up", "september schedule was there", "september schedule exists", "september schedule existed", "existed", "was in the store", "in the document store", "the store had", "store has", "ignored the date", "no date", "did not use the date", "didn't use the date", "didnt use the date", "not filter", "filter by date", "filtered by date", "handed the wrong", "given the wrong", "gave it the wrong", "got the wrong", "supplied the wrong"],
      antiCues: ["the model made up", "the model invented", "the model made it up", "made it up", "the model guessed", "model hallucinated", "information was missing", "not in the store", "no september schedule", "schedule did not exist", "schedule didn't exist", "schedule didnt exist", "no schedule for september exists"] },
    { id: "O3", label: "Says what a good answer would do (name the schedule and week it used, find or ask for week 37, or say not found)", critical: false,
      cues: ["should", "good answer", "better answer", "would say", "would state", "state the date", "say which schedule", "say which week", "say which document", "name the schedule", "name the document", "cite", "quote", "mention the week", "mention the date", "which week it", "from which", "based on the", "dated", "not have next week", "not have the schedule for next week", "could not find next week", "can't find next week", "cannot find next week", "cant find next week", "no schedule for next week", "ask which week", "ask for the", "flag", "warn", "check the date", "check the week", "look for week 37", "look for september", "search for september", "search for week 37", "find the september", "restrict to", "filter", "unknown", "not stated", "not found", "week 37"],
      antiCues: [] },
    { id: "O4", label: "Explains that retrieval matched wording not time, or names a date-aware fix, decline rule or evaluation case", critical: false,
      cues: ["wording", "words", "similar", "similarity", "keyword", "same phrase", "same name", "same route name", "northgate route appears", "matches the words", "not the date", "not by date", "ignores dates", "ignore the date", "ignores the date", "does not know which week", "doesn't know which week", "doesnt know which week", "dont know which week", "no sense of time", "no notion of", "metadata", "date filter", "evaluation case", "test case", "test", "decline", "refuse", "rule", "date-aware", "date aware", "most recent", "latest", "newest", "current week", "by date"],
      antiCues: [] },
  ],
};

export const itemsF06: ItemFamily[] = [
  {
    id: "ITM-F06-retrieval-guarantee", version: 1, capabilityId: "F06", depth: "explain",
    family: "retrieval_guarantee", taskKind: "check", domain: "general",
    title: "What does supplying documents guarantee?",
    objective: "State what giving an assistant a set of documents does and does not guarantee about its answers.",
    supplied: [
      { label: "Situation", text: "A fictional charity, Ridgeway Trust, gives its assistant the full set of its policy documents. Before answering any question, the assistant retrieves the passages that look most similar to the question and writes an answer from them." },
    ],
    prompt: {
      kind: "selected",
      question: "What does supplying those documents guarantee about the assistant's answers?",
      options: [
        { id: "a", text: "That every answer comes from the documents and is therefore correct.", misconceptionId: "retrieval_guarantees_truth" },
        { id: "b", text: "Nothing by itself: retrieval can miss the right passage or pick a wrong one, and generation can still overstate what was retrieved." },
        { id: "c", text: "That any answer which cites a document is supported by that document.", misconceptionId: "citation_means_support" },
        { id: "d", text: "That the answers become more reliable with every additional document added to the set.", misconceptionId: "more_documents_fix_it" },
      ],
      allowUnsure: true,
    },
    successCriteria: "Selects option b.",
    rubricId: "RUB-selected-single",
    hints: ["Think about the two steps separately: finding passages, then writing from them. Which step does having the documents make safe?"],
    misconceptionFeedback: {
      retrieval_guarantees_truth: "Having the documents means passages can be supplied. It does not mean the right passage was supplied, or that the answer stayed within it.",
      citation_means_support: "A citation shows which passage was used. It does not show that the passage answers the question; the lesson's example cited a real passage about the wrong thing.",
      more_documents_fix_it: "More documents mean more passages competing to be retrieved, including stale and conflicting ones. Volume does not make the two steps more reliable.",
    },
    key: {
      correctOptionIds: ["b"],
      acceptedAlternatives: [],
      criticalErrors: [],
      workedAnswer: "Option b. Supplying documents makes it possible for relevant passages to be found; it guarantees nothing on its own. Retrieval may miss, may return irrelevant or conflicting passages, and generation may still misstate what it was given.",
      evaluationCases: [
        { label: "strong", submission: "b", expected: "pass" },
        { label: "fluent_wrong", submission: "a", expected: "fail" },
        { label: "awkward_correct", submission: "b", expected: "pass" },
        { label: "citation_trust", submission: "c", expected: "fail" },
      ],
    },
    estimatedMinutes: 2,
    status: "published",
  },
  {
    id: "ITM-F06-retrieval-trace-explain", version: 1, capabilityId: "F06", depth: "apply",
    family: "retrieval_trace_explain", taskKind: "check", domain: "software",
    title: "Read the trace: what was retrieved, and was it used?",
    objective: "Given a request, the retrieved snippets and the answer, explain what was retrieved, whether it was relevant, where the failure happened and what the answer should have done.",
    supplied: [
      { label: "Request", text: "Does the Pellworth Payments API rate limit reset every minute or every hour?" },
      { label: "Retrieved snippet A (docs/billing.md)", text: "Invoices are generated every hour and finalised at the end of each month. Usage is billed per 1,000 requests." },
      { label: "Retrieved snippet B (docs/limits.md)", text: "Requests are limited to 600 per minute per API key. The counter resets at the start of each minute. Burst allowances are not available." },
      { label: "AI answer", text: "The rate limit resets every hour, as described in docs/billing.md." },
    ],
    prompt: {
      kind: "written",
      question: "Explain what was retrieved, whether each snippet was relevant to the request, whether the failure came from retrieval or from writing the answer, and what the answer should have done.",
      guidance: "Use only the trace. Be explicit about which snippet answers the question and which one the answer actually used.",
      minChars: 60,
    },
    successCriteria: "Identifies snippet B as relevant and snippet A as the irrelevant one cited; attributes the failure to generation because the right passage was retrieved; says the answer should state the per-minute reset citing limits.md, or names a decline rule or check.",
    rubricId: "RUB-F06-retrieval-trace",
    hints: [
      "Read each snippet and ask: does this passage talk about rate limits at all?",
      "The right passage was in the model's input. So which of the two steps went wrong?",
    ],
    misconceptionFeedback: {
      citation_means_support: "The citation to docs/billing.md is real, and the passage exists. It is about invoices, not rate limits, so the citation does not support the claim.",
      similar_means_relevant: "Snippet A shares the words 'every hour' with a plausible answer, which is why it looks related. Sharing words is not the same as answering the question.",
      more_documents_fix_it: "Both snippets were already retrieved, including the right one. Adding documents would not have changed what the model did with them.",
    },
    key: {
      workedAnswer: "Two snippets were retrieved. Snippet B (docs/limits.md) is the relevant one: it states 600 requests per minute and that the counter resets at the start of each minute. Snippet A (docs/billing.md) is about invoicing and billing, not rate limits, so it is irrelevant. Retrieval did its job by finding the right passage; the failure is in generation: the model picked the irrelevant snippet, turned 'invoices are generated every hour' into 'the rate limit resets every hour', and cited billing.md. The answer should have said the limit resets every minute and cited docs/limits.md. More generally, the system should check that the cited passage actually addresses the question, and if no retrieved passage did, say so rather than answer.",
      acceptedAlternatives: [
        "Calls the failure a synthesis or answer-writing failure rather than a generation failure.",
        "Notes that retrieval could be improved by excluding snippet A, while still locating the primary failure in the answer step.",
      ],
      criticalErrors: ["Treats billing.md as a valid source for the rate-limit reset.", "Blames retrieval or missing documentation when the relevant passage was retrieved."],
      evaluationCases: [
        { label: "strong", submission: "Two snippets were retrieved. Snippet B from docs/limits.md is the relevant one: it says 600 requests per minute and the counter resets at the start of each minute. Snippet A from docs/billing.md is about invoices and is irrelevant to rate limits. Retrieval did its job; the failure is in generation: the model used the wrong snippet and turned 'invoices every hour' into 'the rate limit resets every hour'. The answer should have said the limit resets every minute and cited docs/limits.md, and if no retrieved passage covered the question it should say so instead of answering.", expected: "pass" },
        { label: "fluent_wrong", submission: "The assistant retrieved the billing documentation and correctly cites it; invoices and rate limits are both generated hourly, so resetting every hour is right. The failure, if any, is that retrieval missed the more detailed limits page, and more documents would fix it.", expected: "fail" },
        { label: "awkward_correct", submission: "it retrieve 2 snippet. snippet B limits.md is the relevant one, 600 per minute, reset each minute. snippet A billing.md is about invoice, not relevant. the retrieval was fine, the right passage was there, problem is the model pick the wrong one when writing the answer. answer should say reset every minute and cite limits.md. if nothing relevant come back it should say not stated.", expected: "pass" },
        { label: "partial", submission: "The answer is wrong because the limit resets every minute, not every hour; snippet B says so and the citation to billing.md is about invoices. The system should be given more documentation so it finds the right answer next time.", expected: "fail" },
        { label: "blames_retrieval", submission: "Retrieval failed to retrieve the right passage about limits, so the model had no choice but to answer from billing.md. This is a retrieval failure and the fix is a better search index.", expected: "fail" },
        { label: "copied_worked", submission: "Snippet B (docs/limits.md) is the relevant one: it states 600 requests per minute and that the counter resets at the start of each minute. Snippet A (docs/billing.md) is about invoicing, so it is irrelevant. Retrieval did its job by finding the right passage; the failure is in generation: the model picked the irrelevant snippet and cited billing.md. The answer should have said the limit resets every minute and cited docs/limits.md.", expected: "pass" },
      ],
    },
    estimatedMinutes: 7,
    status: "published",
  },
  {
    id: "ITM-F06-retrieval-transfer-operations", version: 1, capabilityId: "F06", depth: "apply",
    family: "retrieval_transfer_operations", taskKind: "transfer", domain: "operations",
    title: "The wrong month's schedule",
    objective: "Apply the retrieval/generation distinction in a new setting: a delivery-desk assistant answered from the wrong week's schedule.",
    supplied: [
      { label: "Situation (fictional retailer, Hollin & Reed)", text: "Staff ask a delivery-desk assistant questions about routes. The assistant retrieves passages from a store of weekly delivery schedules and answers from them. The question was asked on 3 September." },
      { label: "Request", text: "Which days is the Northgate route running next week?" },
      { label: "Retrieved passage (schedule_week_31_july.pdf)", text: "Northgate route: Tuesday and Friday. Drivers: 2." },
      { label: "AI answer", text: "The Northgate route runs on Tuesday and Friday next week." },
      { label: "Note on the document store", text: "The store contains one schedule per week. It includes schedule_week_37_september.pdf, which reads 'Northgate route: Wednesday only. Drivers: 1.' That file was not among the retrieved passages." },
    ],
    prompt: {
      kind: "written",
      question: "Explain the retrieval failure: what was retrieved, why it was the wrong material, and why the answer is wrong even though it faithfully repeats the passage. Then say what a good answer would have done.",
      guidance: "Use only the supplied trace and the note. Say which step failed and what a better answer would say or do.",
      minChars: 60,
    },
    successCriteria: "Identifies that the July schedule was retrieved instead of the September one; attributes the failure to retrieval (the right schedule existed but was not retrieved); describes a good answer that names the week it used, finds or asks for the current schedule, or says it could not find next week's schedule.",
    rubricId: "RUB-F06-retrieval-transfer-operations",
    hints: [
      "Look at the file name of the retrieved passage and the date of the question.",
      "The answer repeats the passage accurately. So which step handed it the wrong thing?",
      "What could the answer have said about which schedule it was reading from?",
    ],
    misconceptionFeedback: {
      similar_means_relevant: "The July passage matched the words 'Northgate route' perfectly. Matching the words is what retrieval does; it did not check which week the passage was about.",
      retrieval_guarantees_truth: "The store held the correct schedule. Holding it is not the same as retrieving it, and the answer step cannot use a passage it was not given.",
      more_documents_fix_it: "The store already had the right document. The fix is retrieval that respects dates, and an answer that names the schedule it used, not more files.",
    },
    key: {
      workedAnswer: "The retrieval step returned a passage from schedule_week_31_july.pdf, a schedule from months earlier, and did not return schedule_week_37_september.pdf even though it was in the store. The passage matched the wording of the question ('Northgate route') but not the time the question was about; retrieval scores similarity of words and paid no attention to the week. The answer then repeated the July passage faithfully, so the writing step did not invent anything: this is a retrieval failure, not a generation failure. A good answer would name the schedule it was reading from ('according to the week 31 schedule from July'), which would make the mismatch visible; better, the system should retrieve by date so that week 37 is found, or the answer should say it could not find next week's schedule and ask which week to check. An evaluation case with a question about a week whose schedule is not the most similar by wording would catch this.",
      acceptedAlternatives: [
        "Describes the fix as filtering the document store by week before retrieval.",
        "Says the answer should decline until the current week's schedule is confirmed.",
      ],
      criticalErrors: ["Says the model invented the days.", "Says the information was not in the store."],
      evaluationCases: [
        { label: "strong", submission: "The retrieved passage came from the week 31 schedule in July, not the September schedule the question was about, so Tuesday and Friday is out of date. This is a retrieval failure: the September schedule existed in the store but was not retrieved, because retrieval matched the words 'Northgate route' and ignored the date. The answer faithfully repeated the passage it was given, so the writing step did not invent anything. A good answer would say which schedule it was reading from, retrieve by date so week 37 is found, or say it could not find next week's schedule and ask which week to check.", expected: "pass" },
        { label: "fluent_wrong", submission: "The answer is correct: the Northgate route has always run Tuesday and Friday, and the schedule is the same every week so July's version is fine to use. The assistant retrieved a relevant passage and cited it, which is exactly what a grounded assistant should do.", expected: "fail" },
        { label: "awkward_correct", submission: "it retrieve the july schedule, week 31, that is old, not next week. the september one was in the store but retrieval didnt find it because it only match the words northgate route, not the date. the model just copy what it got so the fault is retrieval not the model. good answer should say which week schedule it use, or search for september, or say cannot find next week schedule.", expected: "pass" },
        { label: "blames_generation", submission: "The answer is out of date because it used the July schedule. The model made up next week's days instead of admitting it did not know, so this is a generation failure.", expected: "fail" },
        { label: "partial", submission: "The days are wrong because the passage is from July and things have changed since then. The assistant should have said Wednesday only.", expected: "fail" },
        { label: "copied_worked", submission: "The retrieval step returned a passage from schedule_week_31_july.pdf and did not return schedule_week_37_september.pdf even though it was in the store. The passage matched the wording of the question but not the time; retrieval scores similarity of words and paid no attention to the week. This is a retrieval failure, not a generation failure. A good answer would name the schedule it was reading from, retrieve by date so that week 37 is found, or say it could not find next week's schedule.", expected: "pass" },
      ],
    },
    estimatedMinutes: 7,
    status: "published",
  },
  {
    id: "ITM-F06-quick-retrieval", version: 1, capabilityId: "F06", depth: "explain",
    family: "quick_retrieval", taskKind: "check", domain: "community",
    title: "What went wrong here?",
    objective: "Spot, in a tiny trace, that a retrieved passage was about something else and the answer stretched it.",
    supplied: [
      { label: "Request", text: "Can dogs come on the Saturday walks?" },
      { label: "Retrieved passage (newsletter_march.txt)", text: "The club's annual dinner is on 14 March; well-behaved dogs are welcome at the pub afterwards." },
      { label: "AI answer", text: "Yes, well-behaved dogs are welcome on Saturday walks [newsletter_march.txt]." },
    ],
    prompt: {
      kind: "selected",
      question: "What went wrong?",
      options: [
        { id: "a", text: "Nothing: the answer has a citation and the cited passage mentions dogs being welcome.", misconceptionId: "citation_means_support" },
        { id: "b", text: "The retrieved passage is about the dinner, not the walks; the answer stretched an unrelated passage to cover the question and should have said the walks rule was not found." },
        { id: "c", text: "The assistant needs more documents about dogs before it can answer reliably.", misconceptionId: "more_documents_fix_it" },
        { id: "d", text: "The passage does answer the question, because it contains the words 'dogs' and 'welcome'.", misconceptionId: "similar_means_relevant" },
      ],
      allowUnsure: true,
    },
    successCriteria: "Selects option b.",
    rubricId: "RUB-selected-single",
    hints: ["Read the passage again and ask what event it is actually about."],
    misconceptionFeedback: {
      citation_means_support: "The citation is real, but the passage is about the dinner. A citation points at a passage; it does not make the passage relevant.",
      more_documents_fix_it: "The problem is not volume. The answer should have said the walks rule was not found in what was retrieved, whatever the size of the store.",
      similar_means_relevant: "Sharing the words 'dogs' and 'welcome' is why the passage was retrieved. It is about the pub after the dinner, not the Saturday walks.",
    },
    key: {
      correctOptionIds: ["b"],
      acceptedAlternatives: [],
      criticalErrors: [],
      workedAnswer: "Option b. The only retrieved passage concerns the annual dinner. The answer applied it to Saturday walks, which the passage says nothing about. A correct answer would say the retrieved material does not state the rule for walks.",
      evaluationCases: [
        { label: "strong", submission: "b", expected: "pass" },
        { label: "fluent_wrong", submission: "a", expected: "fail" },
        { label: "awkward_correct", submission: "b", expected: "pass" },
        { label: "word_match", submission: "d", expected: "fail" },
      ],
    },
    estimatedMinutes: 2,
    status: "published",
  },
];
