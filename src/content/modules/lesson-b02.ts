import type { Lesson } from "../types";

/**
 * B02: Design an evaluation set for a grounded assistant.
 * UC04 session 4. The handbooks, products and help-centre articles are fictional.
 */
export const lessonB02: Lesson = {
  id: "LES-B02-evalset", version: 1, capabilityId: "B02", depth: "build",
  title: "The test set is the yardstick.",
  outcome: "Write evaluation cases with an expected behaviour for normal, missing-source and conflicting-source questions, plus a rule for invalid output, and keep them as a versioned set that every change is measured against.",
  prerequisites: ["B01", "F08"],
  bridges: [
    {
      domain: "software", requiresFactTypes: ["tool", "role", "action"], keywords: ["python", "api", "software", "developer", "engineer", "code", "http", "web service", "test"],
      scenarioLabel: "imagined",
      text: "You have written tests before changing code so you could tell whether the change helped. Imagine the same discipline for an assistant that answers from documents: a fixed set of questions with expected behaviour, run before and after every change. The scenario below is fictional.",
      analogyLimit: "A unit test usually checks an exact output. An evaluation case for a grounded assistant checks behaviour: the right source cited, a decline when the documents are silent, a conflict surfaced. The comparison is looser but the idea of a fixed yardstick is the same.",
    },
    {
      domain: "operations", requiresFactTypes: ["action", "role"], keywords: ["operations", "coordinat", "logistic", "schedule", "delivery", "project", "process", "checklist"],
      scenarioLabel: "imagined",
      text: "You have used a checklist that stays the same from week to week so that results can be compared. Imagine that checklist as a set of questions put to an assistant, each with the answer it should give. The scenario below is fictional.",
      analogyLimit: "A process checklist mostly covers the normal path. An evaluation set has to include the awkward cases on purpose: the question the documents do not answer and the question two documents answer differently.",
    },
    {
      domain: "supplier_comparison", requiresFactTypes: ["action"], keywords: ["supplier", "bid", "quote", "procure", "vendor", "purchase", "tender"],
      scenarioLabel: "imagined",
      text: "You have compared suppliers against the same list of requirements so the comparison was fair. Imagine comparing two versions of an assistant against the same list of questions with expected answers. The scenario below is fictional.",
      analogyLimit: "Supplier requirements describe what you want. Evaluation cases also describe what the assistant must not do: guess when the documents are silent, or pick one of two conflicting sources without saying so.",
    },
    {
      domain: "leadership", requiresFactTypes: ["role"], keywords: ["lead", "manager", "director", "founder", "head of", "ceo", "owner"],
      scenarioLabel: "imagined",
      text: "You have asked a team 'how do we know it works?' and received a demo. Imagine asking instead for the fixed set of cases the assistant is measured against and the current pass rate on each class. The scenario below is fictional.",
      analogyLimit: "A pass rate on an evaluation set is evidence about those cases. It says nothing about questions the set does not contain, which is why the set has to be extended whenever a new failure is found.",
    },
    {
      domain: "research", requiresFactTypes: [], keywords: ["research", "experiment", "study", "statistic", "data", "analysis", "phd", "thesis"],
      scenarioLabel: "imagined",
      text: "You have held out a test set so that a result could not be tuned to it. Imagine the same for a document assistant: a versioned set of questions with expected behaviour, not edited to make a change look good. The scenario below is fictional.",
      analogyLimit: "A held-out set measures accuracy on a distribution. An evaluation set here is small and deliberately includes rare, high-cost cases, so it is a behavioural specification more than a statistical sample.",
    },
    {
      domain: "general", requiresFactTypes: [], keywords: [],
      scenarioLabel: "imagined",
      text: "Imagine an assistant that answers tenants' questions from a building handbook. Before trusting it, you write down a handful of questions and exactly what a good answer looks like for each, including the questions the handbook cannot answer. The scenario below is fictional.",
      analogyLimit: null,
    },
  ],
  simplerExplanation:
    "An evaluation case is a question plus what a good answer must do. You need three kinds. A normal question, where the answer should give the fact and point at the passage it came from. A question the documents do not answer, where the right response is to say so rather than guess. A question two documents answer differently, where the right response is to show both and say they conflict, not quietly pick one. Add a rule for broken output: if the answer comes back in the wrong shape or points at a passage that does not exist, it is rejected and never shown as if it were fine. Keep the cases in a numbered set and run the same set every time you change something, so you are measuring against the same yardstick.",
  deeperExplanation:
    "An evaluation set for a grounded assistant is a versioned collection of cases, each with an input, the relevant corpus state and an expected behaviour expressed as checkable conditions. Coverage must be by failure class, not by volume: normal cases (answer with the expected cited source), missing-source cases (the corpus does not answer; expected behaviour is an explicit decline or 'not in the documents', with no fabricated figure), conflicting-source cases (two passages disagree; expected behaviour is to surface both with their sources rather than silently choosing), and invalid-output handling (schema violations, citations to non-existent passages, empty answers; expected behaviour is rejection by a validator and a safe fallback, never presentation as a normal answer). The set is the fixed yardstick: a change is evaluated by running the same version of the set before and after, and a case that fails after a change is a regression unless the expected behaviour was wrong, in which case the set is revised and its version incremented with a note. Editing cases to match new behaviour without that discipline removes the yardstick. A small set covers rare, costly behaviours by construction; it does not estimate accuracy over the real question distribution, and pass rates should be reported per class.",
  misconceptions: [
    { id: "happy_path_enough", claim: "Testing with a handful of normal questions is enough to know the assistant works.", repair: "Normal questions cannot reveal how the assistant behaves when the documents are silent or disagree. Those cases must be written on purpose, because they are where the costly failures live." },
    { id: "helpful_guess", claim: "When the documents do not cover a question, the assistant should give its best guess to be helpful.", repair: "A guess presented as an answer from the documents is the worst outcome: it is confidently wrong under the organisation's name. The expected behaviour is an explicit 'not covered in the documents' and, where useful, a route to a person." },
    { id: "pick_one_source", claim: "When two passages conflict, the assistant should pick the most recent or most plausible one and answer cleanly.", repair: "Silently choosing hides the fact that the documents disagree, which is exactly what a maintainer needs to know. The expected behaviour is to surface both with their sources and flag the conflict." },
    { id: "schema_valid_means_correct", claim: "If the output passes the schema check, the content is right.", repair: "A schema check catches shape, not meaning. A well-formed answer can cite a passage that does not exist or does not say what the answer says. Invalid-output handling and content evaluation are separate checks." },
    { id: "moving_yardstick", claim: "If a case fails after a change, edit the case so it passes.", repair: "The set is the yardstick. Revise a case only when its expected behaviour was wrong, record why, and bump the version. Otherwise the failing case is a regression the change introduced." },
    { id: "nearest_passage_applies", claim: "If no passage answers the question, the closest passage can be applied to it.", repair: "A passage about a similar topic is not evidence about the question asked. Applying the pool guest rule to the sauna is a guess wearing a citation." },
  ],
  sources: [
    { label: "Fictional handbooks and help centre", note: "The Elder Court tenant handbook, the Ledgerly help centre, the Ovenbird Bakeries staff handbook and the Kestrel Gym rules are invented for these exercises." },
  ],
  blocks: [
    { type: "orientation", id: "b1", text: "This lesson takes about twelve minutes. You will see four evaluation cases for a fictional document assistant, one per failure class, then write a set of your own for a different assistant that you could reuse as the yardstick for every later change." },
    {
      type: "example", id: "b2", heading: "The corpus",
      text: "Elder Court, a fictional apartment building, has a tenant handbook. An assistant answers tenants' questions from it and returns JSON with an answer, a list of citations and a confidence value.",
      sources: [
        { label: "Handbook, Waste (section 5)", text: "Recycling is collected on Thursdays. Bins must be at the kerb by 07:00." },
        { label: "Handbook, Quiet hours (section 3)", text: "Quiet hours are 22:00 to 07:00 every day." },
        { label: "Handbook, Appendix A (building rules summary)", text: "Quiet hours: 23:00 to 07:00." },
        { label: "Corpus note", text: "The handbook says nothing about satellite dishes or external aerials." },
      ],
    },
    {
      type: "example", id: "b3", heading: "Four cases, one per class",
      text: "Case 1, normal: 'What day is recycling collected?' Expected: 'Thursday', citing Waste section 5; a citation to any other section fails. Case 2, missing source: 'Can I install a satellite dish?' Expected: the assistant says the handbook does not cover it and suggests contacting management; any yes or no fails, and so does an answer borrowed from a rule about something else. Case 3, conflicting sources: 'When do quiet hours start?' Expected: the assistant reports that section 3 says 22:00 and Appendix A says 23:00 and flags the conflict; an answer that gives one time without mentioning the other fails. Case 4, invalid output: the model returns a citation to 'section 9', which does not exist, or returns text that is not valid JSON. Expected: the validator rejects the output, the assistant retries once or returns a safe 'unable to answer' message, and the event is logged; the output is never shown to the tenant as a normal answer.",
    },
    {
      type: "concept", id: "b4", heading: "Expected behaviour, not expected wording",
      text: "Each expected behaviour is a set of conditions you can check, not a sentence the assistant must reproduce. For the normal case the conditions are the fact and the source. For the missing-source case the condition is an explicit decline with no fabricated figure. For the conflicting case it is both sources surfaced and the conflict named. For invalid output it is rejection and a safe fallback. Writing the missing and conflicting cases is where most of the value is: an assistant that passes only normal questions has not been tested on the failures that cost the most.",
    },
    {
      type: "concept", id: "b5", heading: "A versioned set is the fixed yardstick",
      text: "Number the set (v1.0) and run every case before and after each change to the prompt, the retriever, the chunking or the model. A case that passed and now fails is a regression, whatever the demo looks like. When a new failure is found in production, add a case for it and bump the version (v1.1) with a note. Do not edit a case to make a change look good; if the expected behaviour was wrong, change it deliberately, record why, and bump the version. Report pass rates per class, because 100% on normal questions and 40% on missing-source questions is a different situation from 80% overall.",
    },
    { type: "interaction", id: "b6", itemFamily: "evaluation_set" },
    { type: "nextStep", id: "b7", text: "With a versioned evaluation set you can measure any change honestly. The next capability decides what the assistant may do on its own and what needs approval, which becomes another class of case in the same set." },
  ],
  durationMinutes: [10, 15],
  primaryFamily: "evaluation_set",
  transferFamily: "eval_set_transfer",
  shortFamily: "quick_eval_case",
  reviewPrompt: "In two sentences: what is the expected behaviour for a missing-source case and for a conflicting-source case, and why must the set be versioned rather than edited freely?",
  status: "published",
};
