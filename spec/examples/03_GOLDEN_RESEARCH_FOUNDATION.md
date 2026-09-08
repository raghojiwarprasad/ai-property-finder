# Golden lesson 03: a fair test of a prediction system

Use case: UC05. No coding prerequisite for this first concept. Fictional dataset: ten past deliveries with distance, planned arrival and actual arrival. A simple baseline predicts the average delay from the first six examples. Two examples help choose an adjustment. The final two are reserved for a check after choices are fixed.

## Concept and bridge

If you practise a presentation using the same questions every time, success on those questions does not tell you how you will handle new ones. Prediction systems have a related problem: evaluating only on examples used to tune the system can overstate how well it handles fresh cases.

The analogy has a limit: models are not people memorising in the same way. The formal point is that data used to make modelling decisions should be separated from data used for the final independent estimate of performance. Small test sets also produce uncertain estimates.

## Task

A team looks at its final two test examples, changes the system to fix those errors and reports the improved score on those same two examples as an independent result. Explain the problem and propose a better next step.

Expected answer: the final test set has influenced model choices, so the revised score on it is no longer an independent final estimate. Preserve a fresh held-out evaluation when feasible, document decisions and recognise the uncertainty of such a tiny sample. Accept carefully explained alternatives appropriate to limited data; do not insist that two examples establish general reliability.

## Rubric

Critical R1: identifies reuse of evaluation information in tuning. Critical R2: distinguishes improved performance on those examples from evidence about unseen examples. Supporting R3: proposes a fresh evaluation or a justified validation procedure. Supporting R4: notes sample-size uncertainty. Pass requires R1, R2 and one supporting criterion.

## Adaptation

If the learner struggles with the meaning of an average, provide a three-number worked activity and rejoin the experiment. If they understand the split, offer a small code-reading exercise or a new conceptual case according to preference and demonstrated programming. If they say a held-out set guarantees future performance, introduce distribution change and limited samples.

The milestone is an explained experiment, not “researcher status”. A later route can add statistics, coding and actual experiments with reviewed environments.
