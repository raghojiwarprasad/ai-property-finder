# Golden lesson 02: confident output versus supported output

Use cases: UC01, UC03 and UC04 with different depth. The following quotes and organisations are fictional. Supplied source A: “Supplier Elm estimates delivery in 12–15 business days after order confirmation.” Source B: “Supplier Oak offers delivery in 10 business days, subject to stock confirmation.” Neither source offers a delivery guarantee.

## Scene

An AI comparison says: “Choose Elm. Its delivery is guaranteed within 12 days.” The sentence is fluent and specific. The problem is that the supplied evidence supports neither the guarantee nor the shortened range. Specificity does not establish correctness.

## Task

Identify the unsupported parts, write a corrected summary, and add one instruction that would reduce this failure in a future comparison. A strong answer identifies both “guaranteed” and “within 12 days”, preserves the original uncertainty and asks the assistant to state when the supplied material does not contain an answer.

## Rubric and evidence

Critical criterion E1: recognises the invented guarantee. Critical E2: preserves the delivery range and conditions. Supporting E3: separates the supplier's statement from the assistant's recommendation. Supporting E4: adds a source or unknown-state instruction. Pass requires E1 and E2 plus at least one supporting criterion. A citation to the wrong source does not pass E2.

Use the supplied source strings as the source of truth for this exercise. The evaluator should quote only the minimum supporting span needed to explain its grade. It must not browse for a real supplier or invent additional terms.

## Hint ladder

Hint 1: “Compare each promise with the exact wording in the source.” Hint 2: “Look at certainty and the number of days.” Worked answer: show the corrected comparison. If the worked answer is revealed, a corrected version remains assisted; generate or select a different reviewed item family for independent evidence.

## Developer-depth branch

Ask whether supplying documents alone guarantees correct output. Expected answer: no; retrieval may omit relevant text, retrieve irrelevant text, or provide conflicting material, and generation may still misstate it. Require an evaluation case for missing evidence and a rule for declining to answer. Avoid teaching that retrieval simply eliminates hallucination.

## Marketing-depth branch

Replace delivery promises with a product factsheet and an exaggerated marketing claim. The underlying evidence requirement stays the same. Add a distinction between stylistic quality and factual support.

## Next-step examples

Independent pass: “You checked the promise against the source. Next we'll decide what information an assistant needs before answering.” Failure on uncertainty only: “You found the invented guarantee. Let's practise preserving estimates and conditions.” No work saved because of network loss: restore the draft; do not change the learner's state.
