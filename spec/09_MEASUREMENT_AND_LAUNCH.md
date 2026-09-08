# Measurement, evaluation and launch gates

## North-star proposal

Weekly learners who independently demonstrate at least one goal-relevant capability. Count distinct learners and require the published evidence contract, not a single click or self-reported understanding. Report activity and learning separately so high engagement cannot conceal low progress.

This is a proposed operating metric. It must be accompanied by transfer, retention, false-pass rate and fairness checks. A metric that rewards easy tasks can distort the curriculum; task difficulty and capability mix belong in the report.

## Funnel definitions

- Visitor: human-qualified opening of the entry experience, with bot filtering where practical.
- Onboarding started: CV/manual/general-context route chosen.
- Goal set: goal interpretation activated, including provisional general foundations.
- First task attempted: meaningful work submitted, not merely a lesson opened.
- First useful loop completed: saved work, valid feedback and a next-step explanation delivered.
- Activated learner: first independent capability demonstration under the applicable contract.
- Retained learner: returns in a subsequent measurement window and performs meaningful learning work; report day-seven and week-four windows explicitly.
- Healthy completion: supported goal completed with evidence and a deliberate stopping point. Do not count all completed learners who leave as dissatisfied churn.

Use event names defined in each PRD. Store event ID, server timestamp, pseudonymous owner/session ID, goal version, activity/content version, source surface and release version. Exclude raw CV text, full answers and tutor transcripts from general analytics. Diagnostic content review uses a separate authorised process.

## Initial usability targets

Targets to test, not claims: median time from onboarding start to first submitted task under eight minutes; at least 80% of a small moderated test group can explain the product promise and identify the next action without coaching; zero loss of submitted work in acceptance tests; every observed personal-context statement traceable to an explicit fact or labelled scenario.

Do not treat five successful sessions as statistically conclusive. Report counts and qualitative findings. Include failed extraction, abandoned onboarding, unsupported goals and evaluator outages in the funnel. Measure time spent thinking separately from avoidable system latency.

## Learning-quality evaluation set

For every release capability, maintain reviewed examples of correct, incorrect, partially correct, ambiguous, paraphrased, copied and adversarial responses. Include grammatically imperfect correct reasoning and fluent wrong reasoning. Hold out examples from prompt tuning to detect overfitting. At least two subject reviewers should adjudicate disputed cases before the evaluator controls progression for that item family.

Report false passes and false fails separately. A false pass can create misleading progress; a false fail can discourage a capable learner. Critical conceptual errors must not pass in the release fixture suite. For written tasks with low reviewer agreement, revise the task or keep evaluation provisional.

## Personalisation experiment

Hypothesis: a relevant experience-based bridge improves comprehension or engagement without reducing transfer. Compare a reviewed contextual explanation with an equally clear general explanation of the same concept. Keep assessment difficulty and the transfer task comparable. Measure perceived relevance, immediate independent performance and delayed recall separately.

Start with moderated sessions to find obvious failures. Run a suitably powered experiment only after defining the minimum meaningful effect and observing baseline variability. Do not claim causal uplift by comparing self-selected heavy users with casual users.

## Pilot composition and observation

Begin with 12–20 consenting adults across practical use, leadership, marketing, development and research-foundation goals. This is a usability and learning-design pilot, not a market-size estimate. Include at least two people without a CV and people using different devices. Avoid relying entirely on the founder's technically confident friends.

Observe: can they describe their goal; does the context feel accurate; can they explain the concept; does feedback match their reasoning; can they find the next task; do they trust the progress record? Ask what they would use again rather than whether they “like the idea”. Follow up after a delay with a fresh task, with consent.

## Release gates

Gate 0: scope and design accepted against PRODUCT_DECISIONS; no career features. Gate 1: complete first loop works for all supported onboarding routes. Gate 2: four short milestone bundles and the research starter have complete reviewed evidence paths. Gate 3: ownership, deletion, repeated submissions, stale output, provider failure and accessibility acceptance cases pass. Gate 4: moderated users can learn and explain the next step; severe factual and grading errors resolved. Gate 5: external pilot with measured latency, cost and support coverage. Gate 6: deepen practice and test sharing. Gate 7: consider billing after value, retention and cost evidence.

Passing a mocked test does not pass a live provider gate. Passing a local build does not establish usability. Passing a learning task does not establish real-world business impact or professional qualification.

## Product review cadence

Review failed examples and evaluator disputes weekly during the pilot. Prioritise wrong personal facts, false demonstration, inaccessible interactions and lost work above additional dashboards. Review coverage gaps and repeated misconceptions to decide the next content investment. Keep a decision log linking changes to observed problems.

## Cost model

Track extraction cost per new learner, lesson-adaptation cost per session, tutor cost, evaluation cost, storage, practice compute and human review. Contribution per paid learner later equals recognised subscription revenue less payment fees and variable service/review costs. Include inactive subscribers and heavy users honestly. Do not price solely from a provider's headline token rate or promise unlimited usage before observing the distribution.

## Risks and mitigations

Personalisation feels superficial: evaluate action-level context and transfer. Personalisation becomes intrusive: minimise facts and provide control. Assessment is unreliable: strengthen rubrics, validators and appeals. Broad coverage becomes shallow: publish complete milestones and mark planned depth. The UI becomes complicated: protect the three-destination navigation and single next action. AI costs expand: budget by task type and cache safely. Growth distracts from learning: release sharing only after the core value gate.
