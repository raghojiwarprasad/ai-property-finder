import type { Lesson } from "../types";

/**
 * M02: Design a controlled comparison and state its limits.
 * Companies, lists, subject lines and figures are fictional. No result here is a real campaign outcome.
 */
export const lessonM02: Lesson = {
  id: "LES-M02-comparison", version: 1, capabilityId: "M02", depth: "analyse",
  title: "A fair comparison, and what it still cannot tell you.",
  outcome: "Plan a comparison of two creative variants that could actually settle which did better here, and state clearly what such a result does not establish.",
  prerequisites: ["F08"],
  bridges: [
    {
      domain: "marketing", requiresFactTypes: ["action", "role"], keywords: ["campaign", "marketing", "brand", "audience", "copy", "email", "content", "social", "test"],
      scenarioLabel: "imagined",
      text: "You have sent two versions of something and been asked which one 'worked'. Imagine an assistant produces two subject lines and you have to decide how to compare them so the answer means something. The scenario below is fictional.",
      analogyLimit: "Creative judgement tells you which line you prefer. A controlled comparison tells you which one did better on one fixed measure with this audience. Neither tells you why.",
    },
    {
      domain: "supplier_comparison", requiresFactTypes: ["action"], keywords: ["supplier", "bid", "quote", "procure", "vendor", "purchase", "tender"],
      scenarioLabel: "imagined",
      text: "You have compared two suppliers on the same specification so the comparison was fair. Imagine comparing two email subject lines the same way: same conditions, one measure, decided before you look. The scenario below is fictional.",
      analogyLimit: "A supplier comparison is usually one decision on fixed facts. A creative comparison measures behaviour that varies from person to person, so the design has to handle chance, not just fairness.",
    },
    {
      domain: "operations", requiresFactTypes: ["action", "role"], keywords: ["operations", "coordinat", "logistic", "schedule", "delivery", "project", "process", "warehouse"],
      scenarioLabel: "imagined",
      text: "You have seen a process changed one week and the numbers move the next, and wondered whether the change caused it. Imagine deciding in advance how you would tell. The scenario below is fictional.",
      analogyLimit: "In operations you can often see the whole process. In a message test you only see the count of people who acted, so the design has to remove the other explanations before you send anything.",
    },
    {
      domain: "leadership", requiresFactTypes: ["role"], keywords: ["lead", "manager", "director", "founder", "head of", "ceo", "owner"],
      scenarioLabel: "imagined",
      text: "You have been shown a result and asked to act on it. Imagine a team reports that variant B 'won' and wants to change everything. The scenario below is fictional.",
      analogyLimit: "A leader's question is usually 'what should we do'. A comparison answers a narrower question: which of two things did better on one measure, once, with these people.",
    },
    {
      domain: "software", requiresFactTypes: ["tool", "role", "action"], keywords: ["python", "api", "software", "developer", "engineer", "code", "http", "web service"],
      scenarioLabel: "imagined",
      text: "You have compared two implementations with the same test inputs so the comparison was fair. Imagine comparing two subject lines with the same care: same inputs, one metric, chosen before you run it. The scenario below is fictional.",
      analogyLimit: "A benchmark on deterministic code gives the same answer each run. People do not, so a message test also needs enough recipients for the difference to be more than noise.",
    },
    {
      domain: "research", requiresFactTypes: [], keywords: ["research", "experiment", "study", "statistic", "data", "analysis", "phd", "thesis"],
      scenarioLabel: "imagined",
      text: "You have designed or read a study with a control condition. Imagine the same discipline applied to two email subject lines: random assignment, a fixed outcome and an honest limits section. The scenario below is fictional.",
      analogyLimit: "A message test is a small randomised comparison. It can support a causal claim about this message with this audience, but the mechanism and the generalisation still need separate evidence.",
    },
    {
      domain: "general", requiresFactTypes: [], keywords: [],
      scenarioLabel: "imagined",
      text: "Imagine two subject lines for the same email. Someone sends one this week and the other next week, sees a bigger number for the second, and declares it the winner. The scenario below is fictional.",
      analogyLimit: null,
    },
  ],
  simplerExplanation:
    "To compare two versions fairly, give them the same chance: the same kind of people, at the same time, split by chance not by choice, and decide before you send what you will count. Then the only real difference is the version. Even then, the result tells you which one did better here. It does not tell you why, whether it would work for other people, whether the effect lasts, or, if only a few people were involved, whether it was just luck.",
  deeperExplanation:
    "A controlled comparison isolates the variant as the only systematic difference between two groups: the same population, random assignment so that unmeasured differences are spread evenly, the same period so that timing and external events affect both, and one primary metric fixed before the data is seen so that the outcome is not chosen to fit a story. Under those conditions a difference can be attributed to the variant, subject to sampling variation, which is why sample size and a decision rule matter. The design does not identify mechanism (the test cannot say which feature of B caused the difference), does not license generalisation to other audiences, channels or products, does not measure downstream or long-term outcomes unless they are the fixed metric, and does not distinguish a real difference from chance when the groups are small. Selecting a metric after seeing the results converts a test into a search for a flattering number.",
  misconceptions: [
    { id: "bigger_number_wins", claim: "If B got a higher number than A, B is better.", repair: "A higher number only means something when the groups were comparable, the period was the same and the difference is larger than chance would produce with that many people." },
    { id: "different_groups_fine", claim: "Comparing whatever data you already have (A last month to these people, B this month to those) is a fair test.", repair: "Different groups or periods bring other differences with them: who they were, what else was happening, what they had already seen. Random assignment in the same period removes those explanations." },
    { id: "metric_after", claim: "Look at all the numbers afterwards and report whichever shows the clearest difference.", repair: "With several metrics, one will usually differ by chance. Fix the primary metric before the send, and report the others as secondary observations, not as the verdict." },
    { id: "result_explains_why", claim: "A winning variant tells you why it won, so you can apply the lesson everywhere.", repair: "The test compared two whole messages. It cannot say which feature made the difference or whether the same feature would work for a different audience, channel or product." },
  ],
  sources: [
    { label: "Fictional campaign material", note: "Pinecone Outdoor, Larkfield Garden Centre, Fenwick Distribution, their lists, subject lines and figures are invented. No figure in this lesson is a real campaign result." },
  ],
  blocks: [
    { type: "orientation", id: "b1", text: "This lesson takes about twelve minutes. You will read a comparison of two subject lines that looks conclusive, find the reasons it is not, plan a fair version, and then write down what even the fair version cannot tell you." },
    {
      type: "example", id: "b2", heading: "The comparison as reported",
      text: "Pinecone Outdoor, a fictional retailer, tested two subject lines for its spring checklist email.",
      sources: [
        { label: "Subject line A", text: "Your spring trail checklist is here" },
        { label: "Subject line B", text: "Don't head out without this checklist" },
        { label: "What was done", text: "A went to 4,200 long-standing members on a Monday morning in March. B went to 900 subscribers who had joined in the last month, on a Saturday in April, after the team decided to measure clicks because opens looked similar." },
        { label: "Reported conclusion", text: "B had a higher click rate. Urgency works. Use urgent wording in every email from now on, including the members' renewal notice." },
      ],
    },
    {
      type: "concept", id: "b3", heading: "What a fair comparison needs",
      text: "Four things, and the report above has none of them. Same audience: draw both groups from the same list, not members versus newcomers. Random assignment: split by chance so that everything you did not measure is spread evenly between the two groups. Same period: send both at the same time so that weather, news and the day of the week hit both equally. Metric fixed in advance: decide before sending that you will judge on, say, click rate, and write it down; choosing the metric after seeing that opens 'looked similar' is choosing the number that tells the story. Add a sample size and a stopping rule: with 900 people in one arm, a modest difference can be chance.",
    },
    {
      type: "concept", id: "b4", heading: "What even a fair result does not establish",
      text: "Suppose the test had been fair and B's click rate was clearly higher. It still would not tell you why: B differs from A in several ways at once (urgency, the word 'don't', length), and the test compared whole messages. It would not tell you that urgency works for other audiences such as renewing members, other channels or other products. It would not tell you anything about later behaviour, such as unsubscribes or purchases, unless that was the fixed metric. And with small groups it would not separate a real difference from luck. A good plan states these limits next to the result, so that the result is not stretched into a rule.",
    },
    { type: "interaction", id: "b5", itemFamily: "ab_plan" },
    { type: "nextStep", id: "b6", text: "With a brief that controls the claims, a rubric that compares outputs and a measurement plan that states its limits, you have the parts of the marketing milestone. The transfer task applies the same reasoning outside marketing, where the same mistakes are made with different names." },
  ],
  durationMinutes: [10, 15],
  primaryFamily: "ab_plan",
  transferFamily: "ab_limits_transfer",
  shortFamily: "quick_ab_limit",
  reviewPrompt: "In two sentences: what must be the same between the two groups in a fair comparison, and name one thing the result still cannot tell you.",
  status: "published",
};
