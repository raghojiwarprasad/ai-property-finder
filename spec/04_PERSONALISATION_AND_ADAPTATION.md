# Learner model and adaptation policy

## 1. Four independent records

Experience context records what a learner has studied or done, with source and confirmation. Goal records the desired AI capability and scope. Capability evidence records observed task performance, assistance and recency. Preferences record user-selected language, session size, accessibility and example choices.

Do not collapse these into a single profile score. A senior title does not prove AI understanding. A research goal does not imply existing mathematics. A preference for short explanations does not imply low ability.

## 2. Experience representation

Represent each useful experience as facts and relationships: organisation or domain, role, dates if supplied, project, action, tools, constraints and outcome. Each fact includes an ID, exact supporting span, document or user source, extraction confidence and confirmation status. Confidence is the extractor's uncertainty, not a statement about the person's credibility.

Separate explicit facts from inferences. “Managed construction operations for five years” can support an explicit operations context. “Negotiated a hospital contract in Dubai” cannot be inferred from it. A proposed analogy may introduce a fictional procurement scenario, labelled as imagined and containing no invented biography.

Minimise retained personal information. Ignore contact details for teaching, avoid sensitive inferences and do not enrich profiles from external sources in the first release. A smaller set of accurate useful facts is better than a large speculative personality model.

## 3. Goal representation

A goal contains the learner's original words, an editable interpretation, desired performance level, capability targets, relevant context, optional time preference and content coverage status. The learner can accept an initial first milestone without reviewing a technical taxonomy.

Translate “learn AI” into a foundations outcome; “build an AI application” into implementation and evaluation capabilities; “become a researcher” into a long sequence of foundations, experiments and critical reading. Reject career forecasting entirely: a goal can describe research competence without predicting a job or salary.

## 4. Capability states and dimensions

Each capability has a depth dimension: explain, apply, analyse, build or investigate, as appropriate. A learner may demonstrate explanation without implementation. Different dimensions require different tasks.

The state vocabulary is: unknown, introduced, practising, demonstrated and needs review. “Unknown” is missing evidence. “Introduced” is exposure. “Practising” includes partial or assisted work. “Demonstrated” means the configured evidence contract passed. “Needs review” means a scheduled check is due or recent evidence raises a specific concern. Preserve the prior demonstration record when a review is due.

No global mastery percentage is shown. A milestone can report “3 of 5 required capabilities demonstrated” with a link to the evidence; that count is not a measure of total AI expertise.

## 5. Default evidence contract

Initial product policy, to be calibrated: a conceptual capability requires two passing independent tasks from different item families, including one transfer or explanation task. An applied capability additionally requires a task-based artefact or deterministic simulation pass. A delayed check records retention separately; an immediate demonstration can be labelled “Demonstrated today; review scheduled”.

A task has required rubric criteria and critical errors. A pass requires all critical criteria plus the item-specific threshold. These thresholds are defined by the authored rubric; an LLM cannot lower them to be encouraging. Assisted retries and repeated exposure to the same answer do not count as distinct independent evidence.

One failed task does not erase a demonstrated capability. Record the mismatch, ask a discriminating check and distinguish a conceptual gap from execution, reading or interface difficulty. Two distinct failures on the same required concept can move it to practising or needs review with a visible reason and retained history.

## 6. Signals and allowed responses

| Signal | Interpretation | Next action |
| --- | --- | --- |
| CV mentions Python | Provisional familiarity | Offer a short code check; do not grant proficiency |
| Correct without help on fresh transfer task | Independent evidence | Update relevant dimension; consider next prerequisite-ready task |
| Correct after worked answer | Assisted learning | Save improvement; schedule fresh independent variant |
| Confident but wrong | Possible misconception | Name the conflicting idea and use a counterexample |
| Correct but uncertain | Fragile confidence or reasoning | Ask a brief explanation; do not force full repetition |
| Two distinct failures | Likely support need | Reduce one difficulty dimension, repair prerequisite or change representation |
| “Too easy” | Learner preference / claim | Offer a challenge check and shorten explanation if passed |
| “Too hard” | Learner difficulty feedback | Break the task down; keep destination unchanged |
| Long inactivity during task | Ambiguous behaviour | Offer pause/resume; do not reduce ability estimate |
| Simulation misconfiguration | Specific task evidence | Link failure to concept and test a corrected configuration |
| Profile fact corrected | Context correction | Regenerate future examples; retain unrelated capability evidence |
| Goal changed | New target | Recompute requirements; carry compatible evidence forward |

## 7. Next-activity selection

Use an explicit policy before considering learned optimisation. First resume an incomplete chosen task unless the learner opts out. Then offer a due review that is relevant to the current milestone. Otherwise choose the highest-priority missing capability whose prerequisites are satisfied or can be checked. Prefer a small task that distinguishes between plausible gaps rather than repeating a whole lesson.

The policy may choose teach, worked example, guided practice, independent check, transfer, review, project or reflection. It must return reason codes, supporting evidence IDs, current goal version and a proposed activity. The server verifies prerequisites, content availability, duplication, assistance status and policy limits before committing a path revision.

Suggested scheduling starts with a review after roughly two days, then seven and twenty-one days following successful checks. These are adjustable product defaults, not scientifically optimal universal intervals. Relevant retrieval can occur earlier inside another activity. No learner should accumulate an unmanageable compulsory review backlog; the daily review budget is capped by their session preference.

## 8. Difficulty is multidimensional

Adjust jargon, abstraction, number of steps, mathematical detail, code complexity, amount of scaffolding, ambiguity and context familiarity independently. A marketer can receive a rigorous evaluation task without code. A programmer can need a very simple explanation of experimental leakage. “Beginner/intermediate/advanced” alone cannot control teaching quality.

When increasing difficulty, change one or two dimensions and keep the objective visible. When reducing support, explain the transition: “This time, use the same check without the worked example.” User-requested exploration can bypass recommendations for viewing, but demonstration still requires the appropriate evidence.

## 9. Personal-example generation contract

Input: concept ID and reviewed explanation; one or two eligible profile facts; user goal; example preference; known misconceptions; an allowed task template. Output: concept bridge, fictional/real context label, source fact IDs, explanation, analogy limits, follow-up task and unsupported-detail warnings.

The validator must check referenced fact IDs, prohibit unsupported biographical statements and ensure the analogy preserves the concept. Avoid repeating an employer or location in every paragraph. If there is no useful context, use a clear general example and invite a better one later.

## 10. Personalised does not mean trapped in one domain

Begin with the familiar context, introduce the formal concept, then ask for application in a different setting. Example: compare supplier bids to understand evidence checking, then evaluate an AI travel answer or product specification. The concept is understood only when the learner can use the underlying distinction beyond the original story.

For advanced learners, familiar analogies may be unnecessary. Offer the formal statement, code, equation or experiment directly. They can ask for intuition on demand. The goal is comprehension and agency, not maximising the number of personal references.

## 11. Evaluation uncertainty and appeals

LLM-based written evaluation is provisional when the rubric cannot be reliably applied, the answer is ambiguous, or validators disagree. Save the original attempt and expose a retry or review route. Deterministic scoring is preferred where there is an objective check. A separate evaluator prompt and hidden rubric reduce answer leakage but do not guarantee correctness.

Appeals append a new evaluation and preserve the original. Changes can update derived capability state and recommendations, with a clear explanation. Do not mutate historical attempts to make analytics look consistent. Human review is a pilot operations function, not an assumption that a human is instantly available for every learner.

## 12. Auditability and experiments

Persist the activity, content version, model/provider version, prompt version, policy version, source facts, assistance history, evaluation and recommendation reason. This allows an unexpected route to be explained and replayed. Replay uses saved outputs rather than making new external model calls by default.

Measure personalisation against learning outcomes. A relevant analogy may improve perceived relevance without improving transfer. Compare these separately. Do not claim causal learning uplift from correlation between heavy usage and stronger scores.
