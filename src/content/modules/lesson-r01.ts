import type { Lesson } from "../types";

/**
 * Golden lesson 03: a fair test of a prediction system.
 * Source: spec/examples/03_GOLDEN_RESEARCH_FOUNDATION.md (UC05). The delivery dataset is fictional.
 * Ten deliveries: six set the baseline average delay, two choose an adjustment, two are reserved
 * for a check after every choice is fixed.
 */
export const lessonR01: Lesson = {
  id: "LES-R01-fair-test", version: 1, capabilityId: "R01", depth: "explain",
  title: "A fair test needs fresh examples.",
  outcome: "Explain why scoring a prediction system on the examples used to tune it overstates how well it handles new cases, and propose a fairer procedure while noting how uncertain a tiny test is.",
  prerequisites: [],
  bridges: [
    {
      domain: "operations", requiresFactTypes: ["action", "role"], keywords: ["operations", "coordinat", "logistic", "schedule", "delivery", "dispatch", "project"],
      scenarioLabel: "imagined",
      text: "You have estimated when something would arrive and then seen when it actually did. Imagine keeping a small log of planned and actual arrival times and using it to predict the next delay. The dataset below is fictional.",
      analogyLimit: "Your own estimates improve because you remember the cases. A prediction rule only improves in the sense that its numbers were adjusted; the question here is how you find out whether the adjusted rule works on deliveries it was not adjusted for.",
    },
    {
      domain: "research", requiresFactTypes: [], keywords: ["research", "study", "thesis", "experiment", "analysis", "data", "statistic", "science"],
      scenarioLabel: "imagined",
      text: "You have drawn a conclusion from a small set of observations. Imagine ten past deliveries are all the data you have, and you must both build a simple prediction rule and say honestly how good it is. The dataset below is fictional.",
      analogyLimit: "In a study you usually decide the method before collecting data. Here the risk is the opposite order: looking at the check data first and letting it shape the rule.",
    },
    {
      domain: "software", requiresFactTypes: ["tool", "role", "action"], keywords: ["python", "software", "developer", "engineer", "code", "test", "api"],
      scenarioLabel: "imagined",
      text: "You have written tests for code and watched them pass. Imagine a rule that predicts delivery delay, and a small set of deliveries kept back to score it. The dataset below is fictional.",
      analogyLimit: "A unit test that passes after you fix the code is genuine progress, because the test defines the required behaviour. A prediction score on examples you tuned for is not the same: those examples are a sample of the world, not the specification.",
    },
    {
      domain: "leadership", requiresFactTypes: ["role"], keywords: ["lead", "manag", "director", "head of", "founder", "ceo", "board", "budget"],
      scenarioLabel: "imagined",
      text: "You have been shown a result and had to judge whether it will hold up. Imagine a team reports that its delay predictor is accurate, and you need to know what the number was measured on. The dataset below is fictional.",
      analogyLimit: "A forecast that matches last quarter's figures is not evidence about next quarter if last quarter's figures were used to build the forecast. The lesson is about that reuse, not about any particular business figure.",
    },
    {
      domain: "community", requiresFactTypes: [], keywords: ["event", "volunteer", "community", "organis", "organiz", "student", "club", "school"],
      scenarioLabel: "imagined",
      text: "You have guessed how long something would take and been surprised by the real time. Imagine ten deliveries with a planned and an actual arrival time, and a simple rule that guesses the delay for the next one. The dataset below is fictional.",
      analogyLimit: "When you rehearse for something, practice on the real questions helps you. For a prediction rule, scoring on the examples it was adjusted for tells you almost nothing about new cases, and that is the point of this lesson.",
    },
    {
      domain: "general", requiresFactTypes: [], keywords: [],
      scenarioLabel: "imagined",
      text: "Imagine ten past deliveries, each with a planned arrival time and the time the van actually arrived. A simple rule predicts the delay for the next delivery. The dataset below is fictional.",
      analogyLimit: null,
    },
  ],
  simplerExplanation:
    "If you practise a presentation with the same questions every time, doing well on those questions does not tell you how you will do on new ones. A prediction rule has a related problem. If you score it on the same examples you used to adjust it, the score looks better than it deserves. So keep some examples aside, do not look at them while you make choices, and score on them once at the end. And remember: two examples is a very small check, so the final number is rough.",
  deeperExplanation:
    "Formal statement: the data used to make modelling decisions (choosing a baseline, selecting an adjustment, fixing errors) must be separated from the data used for the final independent estimate of performance. Once a reserved example has influenced a decision, a score on that example is no longer an independent estimate; it measures fit to a known case rather than expected performance on unseen cases. The analogy with a person rehearsing has a limit: a model does not memorise the way a person does, and the problem is not memory but information flow from the test data into the choices. Two further limits apply. A small test set gives an uncertain estimate, so a difference of a few minutes on two deliveries could be chance. And a held-out estimate describes deliveries like the ones in the set; if the mix of deliveries changes, the estimate can stop applying.",
  misconceptions: [
    { id: "fixing_test_errors", claim: "If the system gets the reserved examples wrong, fixing those errors and re-scoring on the same examples shows the improvement.", repair: "The fixes were chosen by looking at those examples, so a better score on them is expected whether or not the system improved on new deliveries. The reserved examples have become tuning data." },
    { id: "held_out_guarantees", claim: "A score on held-out examples guarantees how the system will perform in future.", repair: "A held-out score is an estimate for deliveries like those in the set. The mix of deliveries can change, and a small set gives a wide range of plausible values." },
    { id: "training_fit_is_performance", claim: "A rule that fits the examples it was built from is a good rule.", repair: "Fitting known examples is the easy part; any rule with enough adjustments can do it. The useful question is performance on examples the rule has not been adjusted for." },
    { id: "all_data_for_tuning", claim: "More data is always better, so use all ten deliveries to tune the rule and score it on all ten.", repair: "Using every example for tuning leaves nothing to check with. You gain a slightly better-fitted rule and lose any honest estimate of how it will do next time." },
  ],
  sources: [
    { label: "Fictional delivery log", note: "The ten deliveries, distances and times are invented for this lesson. All numbers are illustrative." },
  ],
  blocks: [
    { type: "orientation", id: "b1", text: "This lesson takes about ten minutes and needs no code or formulas beyond an average. You will see a tiny dataset of deliveries, build the simplest possible prediction (an average delay), improve it slightly, and then see why the final check must use examples that played no part in those choices." },
    {
      type: "example", id: "b2", heading: "Ten past deliveries (fictional)",
      text: "Each delivery has a distance, a planned arrival time and the actual arrival time. The delay is actual minus planned, in minutes. We split the ten into three jobs: six to set a baseline, two to choose an adjustment, and two reserved for a final check.",
      sources: [
        { label: "Deliveries 1 to 6 (baseline)", text: "D1: 4 km, planned 10:00, actual 10:12 (delay 12). D2: 9 km, 10:30, 10:48 (18). D3: 2 km, 11:00, 11:03 (3). D4: 7 km, 11:30, 11:45 (15). D5: 12 km, 12:00, 12:27 (27). D6: 5 km, 12:30, 12:39 (9)." },
        { label: "Deliveries 7 and 8 (choose an adjustment)", text: "D7: 10 km, planned 13:00, actual 13:22 (delay 22). D8: 3 km, 13:30, 13:34 (4)." },
        { label: "Deliveries 9 and 10 (reserved for the final check)", text: "D9: 6 km, planned 14:00, actual 14:11 (delay 11). D10: 11 km, 14:30, 14:56 (26)." },
      ],
    },
    {
      type: "example", id: "b3", heading: "Baseline: predict the average delay",
      text: "The six baseline delays are 12, 18, 3, 15, 27 and 9 minutes. They add up to 84, and 84 divided by 6 is 14. So the baseline rule is: predict a 14-minute delay for every delivery. It ignores distance, which is exactly what makes it a baseline: the simplest rule any improvement must beat.",
    },
    {
      type: "example", id: "b4", heading: "Two examples to choose an adjustment",
      text: "Deliveries 7 and 8 suggest distance matters: the 10 km trip was 22 minutes late and the 3 km trip only 4. A candidate adjustment is: predict 8 minutes for trips under 5 km and 20 minutes for 5 km or more. On D7 and D8 this is closer than the flat 14. We choose it. That choice used D7 and D8, so those two can no longer tell us how the adjusted rule does on deliveries it was not chosen for.",
    },
    {
      type: "concept", id: "b5", heading: "Rehearsed questions and the limit of the analogy",
      text: "If you practise a presentation using the same questions every time, success on those questions does not tell you how you will handle new ones. Prediction systems have a related problem: evaluating only on examples used to tune the system can overstate how well it handles fresh cases. The analogy has a limit. A model is not a person memorising answers. The formal point is about information: data used to make modelling decisions must be separated from data used for the final independent estimate of performance.",
    },
    {
      type: "diagram", id: "b6", title: "Ten deliveries, three jobs",
      alt: "Ten boxes in a row representing deliveries 1 to 10. The first six are grouped and labelled 'baseline: compute the average delay'. The next two are grouped and labelled 'choose an adjustment'. The last two are grouped, shaded differently and labelled 'reserved: look only once, after every choice is fixed'. An arrow from the reserved group points to a single final score.",
      svgKey: "data_split",
    },
    {
      type: "example", id: "b7", heading: "The final check on the reserved two",
      text: "Now, and only now, we score both rules on D9 and D10. Baseline (14 for both): errors of 3 and 12 minutes. Adjusted rule (20 for both, since both are 5 km or more): errors of 9 and 6 minutes. Average error 7.5 minutes for each. On this check the adjustment did not clearly help. And with only two deliveries the check is very uncertain: swap in two different deliveries and either rule could look better. That is a fair result, not a disappointing one.",
    },
    {
      type: "concept", id: "b8", heading: "What a small held-out check does and does not tell you",
      text: "A held-out estimate is an honest estimate for deliveries like the ones in the reserved set. It is not a guarantee. Small test sets produce uncertain estimates, and if the mix of deliveries changes (a new route, a new season) the estimate can stop applying. When there is very little data, a carefully explained alternative such as reusing the split in a documented way can be acceptable; what is never acceptable is quietly fixing errors on the reserved examples and reporting the improved score as independent.",
    },
    { type: "interaction", id: "b9", itemFamily: "leakage_explanation" },
    { type: "nextStep", id: "b10", text: "Once you can explain why the reserved examples must stay untouched, the next step is summarising small data tables with arithmetic you can defend: averages, ranges and error summaries." },
  ],
  durationMinutes: [8, 14],
  primaryFamily: "leakage_explanation",
  transferFamily: "quality_inspection_transfer",
  shortFamily: "quick_fair_test",
  reviewPrompt: "In one sentence: why can a score on the reserved examples stop being an independent estimate?",
  status: "published",
};
