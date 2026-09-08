import type { ItemFamily, Rubric } from "../types";

/** Rubric for planning a subject-line comparison (fictional Larkfield Garden Centre). */
export const rubricAbPlan: Rubric = {
  id: "RUB-m02-ab-plan", version: 1, supportingRequired: 1,
  criteria: [
    { id: "P1", label: "Metric fixed in advance", critical: true,
      cues: ["in advance", "beforehand", "before send", "decide before", "decided before", "metric before", "metric decide", "metric first", "before sending", "before we send", "before the send", "before it goes", "before it is sent", "before launch", "before looking", "before seeing", "before we look", "before the results", "ahead of time", "up front", "upfront", "decide the metric", "decided the metric", "decide on the metric", "choose the metric", "chose the metric", "pick the metric", "set the metric", "fix the metric", "fixed metric", "fixed in advance", "agree the metric", "agreed metric", "pre-register", "preregister", "pre-agree", "primary metric", "main metric", "one metric", "single metric", "the metric is", "the metric will be", "metric:", "measure:", "success metric", "success measure", "we will measure", "we will count", "will judge", "judge by", "judged on", "judge on", "decide now", "decide first", "write it down first", "write down the metric", "written down before", "commit to"],
      antiCues: ["after the results", "after seeing the results", "after we see the results", "after we see which", "see which metric", "whichever metric", "whatever metric", "pick the metric later", "decide the metric later", "decide later", "once we see the numbers", "once we have the numbers", "look at all the metrics and pick", "report the best number", "report whichever"] },
    { id: "P2", label: "Comparable groups: random assignment, same list, same period", critical: true,
      cues: ["random", "randomly", "at random", "randomis", "randomiz", "split the list", "split it", "split in half", "split evenly", "split 50", "half the list", "half get", "half receive", "each half", "two halves", "50/50", "50:50", "same time", "same day", "same morning", "same hour", "same period", "same week", "same send", "one send", "in one go", "simultaneous", "at the same", "same audience", "same list", "same segment", "same population", "same kind of people", "same type of people", "comparable", "equivalent groups", "similar groups", "like for like", "like-for-like", "shuffle", "coin", "alternate", "every other", "same conditions", "same email", "only the subject line", "only difference", "only thing that differs", "nothing else changes", "nothing else differs"],
      antiCues: ["a this week and b next", "a this week, b next", "a one week and b the", "b the following week", "b the week after", "a on monday and b on saturday", "a to existing members and b", "a to members and b to", "a to loyal", "b to new subscribers", "to new subscribers and a to", "send them on different", "sent on different days", "different weeks so", "one week each", "a week each"] },
    { id: "P3", label: "States a limit of what the test establishes", critical: false,
      cues: ["cannot tell", "can't tell", "cant tell", "does not tell", "doesn't tell", "dont tell", "won't tell", "will not tell", "does not establish", "doesn't establish", "cannot establish", "does not prove", "doesn't prove", "not prove", "cannot prove", "can't prove", "only tells", "only shows", "only says", "limit", "limitation", "does not explain why", "not why", "why b", "why it", "why one", "reason it", "other audiences", "other lists", "other people", "other segments", "different audience", "different list", "long term", "long-term", "longer term", "later on", "later behaviour", "later behavior", "only opens", "only clicks", "opens are not", "opens aren't", "clicks are not", "clicks aren't", "not sales", "not purchases", "not whether they buy", "not visits", "does not mean", "doesn't mean", "cannot generalise", "can't generalise", "cannot generalize", "can't generalize", "may not hold", "might not hold", "may not apply", "might not apply", "this list only", "for this list", "this audience only", "this send only", "this time only", "not a rule", "not a general rule", "mechanism", "which word", "which part", "what caused"],
      antiCues: [] },
    { id: "P4", label: "Mentions sample size or duration", critical: false,
      cues: ["sample", "sample size", "enough people", "enough recipients", "enough subscribers", "enough to", "large enough", "big enough", "how many", "number of people", "number of recipients", "at least", "3,000", "3000", "6,000", "6000", "thousand", "duration", "how long", "wait", "days", "hours", "48 hours", "24 hours", "a week", "one week", "seven days", "noise", "noisy", "chance", "luck", "lucky", "fluke", "random variation", "small difference", "too small", "small numbers", "small groups", "statistic", "significan", "confidence", "margin", "run it again", "repeat", "replicate", "stopping rule", "stop when", "decision rule", "minimum difference", "how big a difference"],
      antiCues: [] },
  ],
};

/** Rubric for the warehouse picking-instruction transfer (fictional Fenwick Distribution). */
export const rubricAbLimits: Rubric = {
  id: "RUB-m02-ab-limits", version: 1, supportingRequired: 1,
  criteria: [
    { id: "L1", label: "Identifies that different weeks make the comparison uncontrolled (other things changed)", critical: true,
      cues: ["different weeks", "different week", "two different weeks", "separate weeks", "not the same week", "other things changed", "other things were different", "something else", "other differences", "other factors", "other explanations", "another explanation", "confound", "confounded", "confounding", "mixed up with", "muddled", "could be the", "could be because", "might be the", "might be because", "may be the", "may be because", "could have been", "may have been", "might have been", "could also be", "could just be", "temporary staff", "temp staff", "new staff", "new people", "agency staff", "order mix", "large orders", "fewer large", "big orders", "smaller orders", "easier orders", "easier week", "stock", "restock", "holiday", "bank holiday", "not comparable", "not a fair", "isn't a fair", "unfair", "not fair", "apples", "not like for like", "not like-for-like", "learning", "practice", "got used to", "settled in", "week two", "week 2", "second week", "week one", "week 1", "first week", "not controlled", "uncontrolled", "no control", "not the only difference", "not the only thing", "not only the instruction", "more than one thing changed", "two things changed", "several things changed"],
      antiCues: ["the comparison is fair", "this is a fair comparison", "was a fair comparison", "it is a fair test", "it's a fair test", "this was a fair test", "clearly better", "proves the new", "proves that the new", "shows the new instruction is better", "is definitely better", "conclusion is correct", "conclusion is right", "the conclusion is sound", "the conclusion holds", "conclusion is valid", "safe to conclude", "safe to roll out"] },
    { id: "L2", label: "Says what the comparison does not establish", critical: true,
      cues: ["does not establish", "doesn't establish", "cannot establish", "can't establish", "does not show", "doesn't show", "cannot show", "can't show", "does not prove", "doesn't prove", "cannot prove", "can't prove", "not proven", "cannot conclude", "can't conclude", "cannot say", "can't say", "cant say", "not enough to say", "does not tell", "doesn't tell", "cannot tell", "can't tell", "cant tell", "not know", "don't know", "dont know", "do not know", "unclear whether", "no way to know", "no way of knowing", "cannot be sure", "can't be sure", "not sure", "not certain", "uncertain", "does not mean", "doesn't mean", "only shows", "only tells", "only says", "does not follow", "doesn't follow", "not justified", "unjustified", "goes beyond", "overreach", "over-reach", "too strong", "which part", "what caused", "the cause", "caused the", "causal", "whether the instruction", "whether it was the instruction", "if it was the instruction", "due to the instruction", "because of the instruction", "not necessarily", "not necessarily better", "may not be better", "might not be better", "is not better", "no evidence that", "not evidence"],
      antiCues: [] },
    { id: "L3", label: "Proposes a fairer design (random assignment, same period, same order mix)", critical: false,
      cues: ["random", "randomly", "at random", "randomis", "randomiz", "same week", "same period", "same time", "same days", "same day", "at the same time", "in the same week", "split the team", "split the pickers", "split the staff", "half the", "half of the", "one half", "each half", "alternate", "alternating", "swap", "switch", "cross over", "crossover", "both instructions in the same", "both in the same", "run both", "run them together", "side by side", "side-by-side", "same shift", "same shifts", "same orders", "similar orders", "same order mix", "same mix", "same staff", "same people", "same team", "same pickers", "counterbalance", "mix the", "assign", "in parallel", "at once", "concurrently"],
      antiCues: [] },
    { id: "L4", label: "Mentions a metric fixed in advance, or sample size and duration", critical: false,
      cues: ["in advance", "beforehand", "up front", "upfront", "decide the metric", "decide on the metric", "fix the metric", "fixed metric", "agree the metric", "agreed metric", "primary metric", "one metric", "single metric", "the metric", "metric:", "measure:", "picks per hour", "pick rate", "error rate", "errors", "accuracy", "mispicks", "mis-picks", "wrong items", "sample", "enough", "how many", "longer", "more weeks", "several weeks", "more than one week", "more than a week", "a few weeks", "repeat", "run it again", "chance", "noise", "noisy", "luck", "fluke", "8% could", "8 percent", "eight percent", "small difference", "week is short", "one week is", "one week isn't", "one week is not", "only one week", "just one week", "too short", "statistic", "significan", "decision rule", "before starting", "before the trial", "before we start"],
      antiCues: [] },
  ],
};

export const itemsM02: ItemFamily[] = [
  {
    id: "ITM-M02-ab-plan", version: 1, capabilityId: "M02", depth: "analyse",
    family: "ab_plan", taskKind: "check", domain: "marketing",
    title: "Plan a fair test of two subject lines",
    objective: "Write a comparison plan for two supplied subject lines that would let you say which did better here, and state what the result would not establish.",
    supplied: [
      { label: "Context (fictional)", text: "Larkfield Garden Centre sends a weekly email to a list of 6,000 subscribers. This week's email announces a new range of seed trays. Two subject lines were produced." },
      { label: "Subject line A", text: "New seed trays have arrived" },
      { label: "Subject line B", text: "Ready to sow? New seed trays for spring" },
      { label: "Note", text: "Last month the team compared two headlines by sending one to the Tuesday list and one to the Thursday list, then reported opens because opens showed a bigger gap than clicks." },
    ],
    prompt: {
      kind: "written",
      question: "Plan a comparison of A and B that would be fair. Say who gets which line and how that is decided, when each is sent, which single metric you will judge on and when you decide that, and roughly how many people or how long you need. Then state at least one thing the result would still not tell you.",
      guidance: "Write it as instructions someone else could follow. The plan should make the subject line the only systematic difference between the two groups.",
      minChars: 80,
    },
    successCriteria: "The metric is fixed before sending; both groups come from the same list, assigned at random, and are sent in the same period; the plan states a limit of what the result establishes; sample size or duration is mentioned.",
    rubricId: "RUB-m02-ab-plan",
    hints: [
      "Ask what, apart from the subject line, could differ between the two groups, and remove each difference.",
      "The metric has to be written down before the send. Say which one and when you decide.",
      "Even a fair result compares two whole messages once. What does that leave unanswered?",
    ],
    misconceptionFeedback: {
      different_groups_fine: "Tuesday and Thursday lists are different people on different days. Anything that differs between them competes with the subject line as an explanation. Split one list at random and send both at the same time.",
      metric_after: "Choosing opens because they showed the bigger gap is choosing the metric to fit the result. Decide the metric before sending.",
      bigger_number_wins: "A bigger number in one group is only evidence if the groups were comparable and the difference is more than chance would produce with that many people.",
      result_explains_why: "If B wins it does not follow that questions or the word 'spring' work in general. The test compared two whole subject lines once, with this list.",
    },
    key: {
      workedAnswer: "Take the full list of 6,000 and split it at random into two halves of 3,000; every subscriber has the same chance of getting A or B. Send both versions at the same time on the same day with an identical email body, so the subject line is the only difference. Before sending, write down the single metric: click rate on the seed-tray link within 48 hours; opens and unsubscribes are recorded but are secondary. Decide before sending what difference would count (for example, at least two percentage points) and do not stop early or switch metrics. With 3,000 per group a small gap may still be chance, so if the gap is inside that margin report 'no clear difference' rather than a winner. Limits: even a clear result does not say why B did better (question, the word spring, length), does not show that the same style works for other lists or products, and says nothing about purchases or later unsubscribes unless those were the fixed metric.",
      acceptedAlternatives: [
        "Chooses open rate as the fixed metric, provided it is chosen before the send and stated as the single primary metric.",
        "Uses a smaller pilot split (for example 1,000 each) with the remainder sent later with the winner, provided the comparison groups are random and simultaneous.",
      ],
      criticalErrors: [
        "Sends A and B on different days or to different segments.",
        "Chooses the metric after looking at the results, or leaves it open.",
      ],
      evaluationCases: [
        {
          label: "strong",
          submission: "Split the 6,000 list at random into two halves of 3,000. Send A to one half and B to the other at the same time on the same morning, with the same email body so the subject line is the only difference. Before sending, fix the single metric: click rate on the seed-tray link within 48 hours; opens are recorded but not the verdict. Decide in advance that a gap under two points counts as no clear difference, since with 3,000 per group a small gap can be chance. Limits: the result cannot tell us why the winner won or whether the same style works for other lists or products, and it says nothing about purchases.",
          expected: "pass",
        },
        {
          label: "fluent_wrong",
          submission: "Send A to the Tuesday list and B to the Thursday list, as we did last month, so we can compare against previous results. After both have gone out, look at opens, clicks and replies and report whichever metric shows the clearest difference. The higher number wins and we adopt that style for all future emails.",
          expected: "fail",
        },
        {
          label: "partial_no_advance_metric",
          submission: "Randomly split the list in half and send both subject lines at the same time with the same body. Afterwards we can see which metric shows a difference and report that one. The result will not tell us why one line won.",
          expected: "fail",
        },
        {
          label: "awkward_correct",
          submission: "take whole list, split random two group 3000 each, send A to one, B to other, same day same time, body same. metric decide before send: click rate in 48 hour, write it down, no change after. 3000 each is enough maybe but small gap could be chance so we say no clear winner if gap tiny. result only tell which line got more click on this list this time, not why, not if works for other audience.",
          expected: "pass",
        },
        {
          label: "copied_worked",
          submission: "Take the full list of 6,000 and split it at random into two halves of 3,000. Send both versions at the same time on the same day with an identical email body. Before sending, write down the single metric: click rate on the seed-tray link within 48 hours. With 3,000 per group a small gap may still be chance. Limits: even a clear result does not say why B did better, does not show that the same style works for other lists, and says nothing about purchases.",
          expected: "pass",
        },
      ],
    },
    estimatedMinutes: 8,
    status: "published",
  },
  {
    id: "ITM-M02-ab-limits-transfer", version: 1, capabilityId: "M02", depth: "analyse",
    family: "ab_limits_transfer", taskKind: "transfer", domain: "operations",
    title: "Two picking instructions, two weeks, one conclusion",
    objective: "Apply the same reasoning outside marketing: explain what a week-on-week comparison of two warehouse instructions does not establish, and how to compare them fairly.",
    supplied: [
      { label: "What happened (fictional Fenwick Distribution)", text: "Week 1: pickers used the old instruction sheet. Average 62 picks per hour. Week 2: pickers used a new instruction sheet. Average 67 picks per hour, about 8% higher." },
      { label: "Also true of those weeks", text: "Two agency staff started on the Monday of week 1. Week 2 followed a stock delivery, and the order mix that week had fewer large multi-item orders. The team decided after week 2 to report picks per hour rather than error rate, which rose slightly." },
      { label: "Conclusion reported", text: "The new instruction sheet is better. Roll it out to all three warehouses." },
    ],
    prompt: {
      kind: "written",
      question: "What does this comparison not establish, and why? Then describe how you would compare the two instruction sheets fairly, including what you would decide before starting.",
      guidance: "Look for every difference between the two weeks other than the instruction sheet, then say what a fair comparison would hold constant.",
      minChars: 80,
    },
    successCriteria: "Identifies that the two weeks differed in staff, order mix and stock so the instruction sheet is not the only difference; states what the comparison cannot establish; proposes random assignment or same-period comparison; mentions fixing the metric in advance or sample size and duration.",
    rubricId: "RUB-m02-ab-limits",
    hints: [
      "List everything that was different between week 1 and week 2. How many items are on the list besides the instruction sheet?",
      "Notice when the metric was chosen, and what happened to the other metric.",
    ],
    misconceptionFeedback: {
      different_groups_fine: "Week 1 and week 2 had different staff, a different order mix and a stock delivery between them. Any of those could explain 5 picks per hour.",
      metric_after: "Picks per hour was chosen after the error rate went the wrong way. A fair test names its metric before the trial starts.",
      bigger_number_wins: "67 is higher than 62, but new staff settling in and easier orders would also raise the number without the sheet doing anything.",
      result_explains_why: "Even a fair result at this warehouse would not by itself justify rolling out to all three; it would show the sheet did better here under these conditions.",
    },
    key: {
      workedAnswer: "The comparison does not establish that the new sheet caused the increase. The two weeks differed in more than the instruction sheet: two agency staff started in week 1 and would have been faster by week 2 anyway; week 2 had fewer large multi-item orders, which are slower to pick; a stock delivery changed what was on the shelves. Any of these could produce 5 picks per hour. The metric was also chosen after the fact, when error rate went the wrong way, so the reported number was selected to fit the conclusion. It cannot say the sheet is better, cannot say why any improvement happened, and cannot justify rolling out to the other two warehouses. A fair comparison: in the same week, randomly assign pickers (or shifts) to the old or new sheet, with the same order mix and the same staff, ideally alternating so each person uses both; decide before starting that the primary metric is picks per hour with error rate as a required secondary check; run for long enough (several weeks) to see whether an 8% gap is more than normal week-to-week variation.",
      acceptedAlternatives: [
        "Proposes alternating sheets day by day within the same week as the fair design.",
        "Chooses error-adjusted picks per hour as the fixed metric.",
      ],
      criticalErrors: ["Accepts the week-on-week comparison as fair.", "Does not say what the result fails to establish."],
      evaluationCases: [
        {
          label: "strong",
          submission: "It does not establish that the new sheet is better. The two weeks differed in other ways: agency staff started in week 1 and were settled by week 2, week 2 had fewer large orders, and stock had just been delivered. Any of those could explain the 8%. The metric was also picked after the fact when error rate rose, which is choosing the number that fits. So we cannot say the sheet caused the gain, why it happened, or that it will hold at the other warehouses. Fairer: in the same week, randomly assign pickers to old or new sheet with the same order mix, decide in advance that the metric is picks per hour with error rate as a check, and run for several weeks so an 8% difference can be told from normal variation.",
          expected: "pass",
        },
        {
          label: "fluent_wrong",
          submission: "The comparison is fair and the conclusion is correct: the same warehouse, the same team, and an 8% improvement in picks per hour is a clear signal. Error rate rose only slightly and is a secondary concern. The new sheet is definitely better and the rollout to all three warehouses is justified.",
          expected: "fail",
        },
        {
          label: "partial_no_limit",
          submission: "There were other differences between the weeks: new agency staff, fewer large orders and a stock delivery. To compare fairly, run both sheets in the same week with pickers assigned at random.",
          expected: "fail",
        },
        {
          label: "awkward_correct",
          submission: "week 1 and week 2 not same, new staff start week 1 so faster in week 2 anyway, order mix easier week 2, stock delivery. so 8% could be from that not the sheet. also they pick picks per hour after error rate go up, that is cheating a bit. cant say sheet is better or why, cant say other warehouse same. fair way: same week, random pickers get old or new sheet, same orders, decide metric before start, run more weeks.",
          expected: "pass",
        },
        {
          label: "copied_worked",
          submission: "The comparison does not establish that the new sheet caused the increase. The two weeks differed in more than the instruction sheet: two agency staff started in week 1; week 2 had fewer large multi-item orders; a stock delivery changed what was on the shelves. The metric was chosen after the fact. A fair comparison: in the same week, randomly assign pickers to the old or new sheet, decide before starting that the primary metric is picks per hour, and run for several weeks.",
          expected: "pass",
        },
      ],
    },
    estimatedMinutes: 8,
    status: "published",
  },
  {
    id: "ITM-M02-quick-ab-limit", version: 1, capabilityId: "M02", depth: "analyse",
    family: "quick_ab_limit", taskKind: "check", domain: "general",
    title: "What the result does not say",
    objective: "Pick the reason a conclusion goes beyond what a fair comparison established.",
    supplied: [
      { label: "The test (fictional)", text: "A community theatre split its 12,000-address newsletter list at random, sent subject line A to one half and B to the other at the same time, and had fixed open rate as the metric beforehand. B's open rate was 4 points higher." },
      { label: "The conclusion", text: "Urgent wording works. Use it in every email, including the appeal to major donors." },
    ],
    prompt: {
      kind: "selected",
      question: "What is the strongest reason the conclusion goes beyond the result?",
      options: [
        { id: "a", text: "The test does not say why B won, nor whether the same wording would work for a different audience such as major donors." },
        { id: "b", text: "Open-rate differences are never meaningful, so nothing can be concluded.", misconceptionId: "bigger_number_wins" },
        { id: "c", text: "The test was invalid because the metric was chosen before the send instead of after.", misconceptionId: "metric_after" },
        { id: "d", text: "The groups were not comparable because they were split at random.", misconceptionId: "different_groups_fine" },
      ],
      allowUnsure: true,
    },
    successCriteria: "Selects option a.",
    rubricId: "RUB-selected-single",
    hints: ["The test itself was fair. Ask what a fair test of two whole messages, once, with one list, can and cannot show."],
    misconceptionFeedback: {
      bigger_number_wins: "A 4-point gap on 6,000 per group in a fair test is real evidence that B did better here. The problem is not the number; it is how far the conclusion travels from it.",
      metric_after: "Fixing the metric before the send is what makes the result trustworthy. Choosing it afterwards is the mistake.",
      different_groups_fine: "Random assignment is what makes the groups comparable. It spreads every unmeasured difference evenly.",
    },
    key: {
      correctOptionIds: ["a"],
      workedAnswer: "The design was sound, so the result supports 'B did better on opens with this list this time'. It does not identify which feature of B mattered, and it does not cover major donors, who were not in the test. Option a names both gaps.",
      acceptedAlternatives: [],
      criticalErrors: [],
      evaluationCases: [],
    },
    estimatedMinutes: 2,
    status: "published",
  },
  {
    id: "ITM-M02-metric-after-selected", version: 1, capabilityId: "M02", depth: "analyse",
    family: "metric_after_selected", taskKind: "check", domain: "marketing",
    title: "Which number is the verdict?",
    objective: "Recognise the problem with declaring a winner on a metric chosen after the results were seen.",
    supplied: [
      { label: "The test (fictional Wheelhouse cycle insurance)", text: "Two headlines for a quote page were shown to visitors at random over the same fortnight. Before the test, the team wrote down quote-form completions as the metric." },
      { label: "The results", text: "Completions: A 3.1%, B 3.0%. Time on page: B 9% higher. Scroll depth: B 5% higher. An analyst reports: 'B wins on engagement; adopt B.'" },
    ],
    prompt: {
      kind: "selected",
      question: "What is wrong with the analyst's verdict?",
      options: [
        { id: "a", text: "Nothing. B performed better on two of the three measures, so it is the better headline.", misconceptionId: "bigger_number_wins" },
        { id: "b", text: "The verdict uses a metric chosen after seeing the results; on the metric fixed beforehand there is no meaningful difference." },
        { id: "c", text: "The test should be rerun with A and B shown on different weeks to confirm the engagement effect.", misconceptionId: "different_groups_fine" },
        { id: "d", text: "B should be adopted because higher engagement explains why people complete forms.", misconceptionId: "result_explains_why" },
      ],
      allowUnsure: true,
    },
    successCriteria: "Selects option b.",
    rubricId: "RUB-selected-single",
    hints: ["Which metric did the team commit to before the test, and what does that metric show?"],
    misconceptionFeedback: {
      bigger_number_wins: "Counting metrics is not evidence. With several measures, one will usually differ by chance. The fixed metric is the verdict, and it shows no meaningful gap.",
      different_groups_fine: "Different weeks would make the test worse, not better. The original design (random, same fortnight) was sound.",
      result_explains_why: "The test did not measure why anyone completes a form. Time on page rising while completions did not is not an explanation; it is a second number.",
      metric_after: "Switching to whichever number favours one variant is the error this item is about.",
    },
    key: {
      correctOptionIds: ["b"],
      workedAnswer: "The fixed metric was completions, and A and B are within a tenth of a point. 'Engagement' was chosen after the results were visible because it favoured B. The honest report is 'no clear difference on completions; time on page and scroll depth were higher for B and could be looked at in a new test with that metric fixed in advance'.",
      acceptedAlternatives: [],
      criticalErrors: [],
      evaluationCases: [],
    },
    estimatedMinutes: 2,
    status: "published",
  },
];
