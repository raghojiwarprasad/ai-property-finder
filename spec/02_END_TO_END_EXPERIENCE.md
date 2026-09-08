# End-to-end experience

## 1. The entry point

The opening screen has one promise: “Learn AI, starting with you.” Supporting copy: “Bring your experience. Choose what you want to do with AI. Start with a lesson built around you.” Primary action: “Build my learning path”. Secondary action: “Try an example”. Avoid a feature wall, unexplained agent terminology or an immediate pricing decision.

“Try an example” opens an explicitly labelled fictional learner and a short real interaction. It does not silently create a profile for the visitor or pretend to know their background. A visitor can return to personalised onboarding at any time.

## 2. Step one: bring your experience

The screen asks, “What experience are you bringing?” A prominent upload area accepts PDF, DOCX and TXT files up to the configured 10 MB product limit. The alternative “Tell us instead” opens a short text area. Suggested cue: “What have you studied or worked on? Mention one task or project you know well.”

The user sees a concise explanation before upload: their CV is used to personalise learning; they can edit or remove the extracted context. Contact details are not needed for teaching. A retention notice links to the exact policy defined in PRD-10, including guest expiry and raw-file deletion.

Do not request a LinkedIn login, phone number, date of birth, salary, nationality or psychometric quiz. The upload is sufficient to start a draft. An unreadable document produces an honest recovery path, not a plausible invented biography.

While processing, show real stages: “Reading your document”, “Picking out useful experience”, “Preparing your starting point”. Do not show fictional percentages or hundreds of claimed insights. If processing exceeds 20 seconds, offer to continue with a brief description while processing remains cancellable.

## 3. Step two: choose the destination

The next screen asks, “What do you want to do with AI?” It provides plain-language suggestions plus a free-text field. Suggestions: “Use AI confidently in my work”, “Lead AI decisions”, “Build AI applications”, “Use AI in marketing”, and “Study AI deeply, including research”. A person can write another AI goal.

Goal parsing translates the aspiration into an observable first milestone. “Become an AI researcher” might produce “Start by designing and evaluating a simple prediction experiment”, followed by the larger foundation map. “Learn everything about AI” should prompt one optional in-context clarification about the first desired outcome, with a default broad foundations start if the learner skips.

An inline card says, for example, “We'll use your supplier coordination experience for early examples.” The learner can correct it without visiting a separate profile screen. One optional control offers 10, 20 or 40 minutes per session; 20 minutes is a visible, editable starting preference, not an inferred commitment.

The primary action is “Start my first lesson”. No third mandatory planning wizard, full diagnostic or account form interrupts this action. Guest progress is supported under an opaque server-issued session. Creating an account is offered when there is something worth saving.

## 4. The first learning scene

The learner lands inside a short lesson, not a dashboard. The top displays the current goal in plain language and a first capability: “Tell useful AI output from a convincing guess”. A short context bridge uses one or two confirmed facts. It explicitly labels any new scenario as imagined.

Example: “You have coordinated supplier bids. Imagine an assistant compares three quotes. One answer looks polished but includes a delivery guarantee that no supplier offered. The problem is not its writing; it is the missing evidence.”

The scene asks the learner to choose the safer response or fix a task brief. A small worked example is available on demand. The first useful explanation should arrive progressively while the broader plan is still being prepared. If generation fails, the system can offer a reviewed generic lesson, clearly stating that the personal example could not be prepared yet.

## 5. An assessment that feels like learning

The first task is brief, low-pressure and relevant. The learner might identify an unsupported claim, revise a prompt, predict a model failure or inspect an evaluation result. The product says, “Try this so I can choose the right next step.” It does not label the user as beginner from one error.

The assessment supports uncertainty: a learner may select “I'm not sure” or ask for a hint. This is valuable context, not a failure to punish. A confident wrong answer triggers a different response from a tentative correct answer. Neither self-reported confidence nor elapsed time independently determines competence.

After submission, feedback identifies the relevant criterion and the evidence in the learner's answer. A corrected attempt receives feedback but is marked assisted when the answer or a close worked solution was shown. Only a fresh variant can supply new independent evidence.

## 6. The first visible adaptation

The product should demonstrate a meaningful change before it asks for a habit. Example: “You spotted the missing evidence. Next, let's learn how to supply reliable source material.” Alternatively: “The output format was clear. Let's practise deciding which sources the assistant may use before we continue.”

The next activity can change while the current activity remains stable. Do not regenerate the whole interface mid-answer. Store a path revision with a reason; show the user the next change at a natural transition. “Why this next?” opens a concise explanation and the supporting activity, not an opaque score.

## 7. The first save moment

After useful feedback, offer “Save my progress” with a short explanation: “Keep this work and continue from this point on another device.” A dismissible account prompt is preferable to a modal that hides the result. Guest work persists for the defined seven-day window unless deleted sooner.

Account creation atomically transfers the guest's confirmed profile, goal, drafts and evidence to the authenticated account. It must not overwrite an existing account's goal silently. If a logged-in account already has progress, show a merge preview with keep/separate options.

## 8. Today: the returning learner

Today starts with one large next-activity block: capability, a reason, approximate duration and “Continue”. Below it show one recent achievement and, when useful, one review due. The full curriculum, statistics and settings do not compete with the next action.

If the learner has five minutes, “Make this shorter” chooses a smaller meaningful task and preserves the full activity. If they have a long session, “Keep going” assembles the next eligible block. A failed task is not automatically followed by more of the same content; the adaptation policy diagnoses the gap and changes support.

After an absence, show “Let's pick up from here” and a short retrieval activity. Do not display a broken streak, accumulated guilt or a punitive backlog. The product should distinguish forgotten material from material never demonstrated.

## 9. My path: orientation without overload

My path answers three questions: what am I working towards, what is the next milestone, and what have I already demonstrated? Show milestone cards vertically. Expand one milestone into activities when requested. The rest remain concise.

Each milestone describes an outcome and an evidence requirement. “Evaluate a simple AI workflow using a test set” is better than “Module 4: Advanced AI”. A milestone can contain several capabilities, examples and practice variants without exposing a complicated graph by default.

The learner can preview later milestones, ask why something is included, take an eligibility check, or change the goal. No graph should imply that there is one universally correct sequence. Changes preserve old evidence and mark where fresh checks are needed.

## 10. My work: proof with context

My work contains saved briefs, explanations, evaluations, code submissions and simulation results. Each item shows the learning purpose, version, feedback, support used and the capability it contributes to. A raw model output created without learner decisions is not presented as a demonstrated skill.

A learner can compare a first and revised attempt. The comparison names improvements, such as adding source restrictions or a failure-case test. Sharing is explicit and uses a sanitised copy. Private learning evidence remains available only to the learner and authorised service functions.

## 11. Deepening and changing direction

A marketer who becomes curious about how models work can choose “Go deeper” without abandoning their goal. This adds a bounded branch or preview. To change the main destination, use “Change goal”; show which demonstrated capabilities carry over, which prerequisites become relevant, and which future milestones are planned rather than available.

Supporting foundations should maintain connection to AI. Teach probability through prediction uncertainty, programming through inspecting model inputs and outputs, and linear algebra through representations. Also teach the underlying idea accurately enough that the person can transfer it beyond the example.

## 12. Trust repair and control

Every personal example has “This doesn't fit me”. The learner can switch context for this lesson or correct the underlying profile fact. A correction invalidates future generated examples using the fact; it does not erase unrelated skill evidence or an old task the learner completed.

Every assessment has a feedback challenge route: “I think this was marked incorrectly.” Preserve the original attempt and grade, create a re-evaluation event, and show when evidence is provisional. Do not force a learner to accept an opaque model judgement to continue exploring.

## 13. Completion and the next milestone

Completion should explain what was demonstrated and under what conditions. “You compared two AI outputs against a source and explained the unsupported claim without a hint” is useful. A milestone can be complete while a later review is due.

Offer the next milestone with a reason, an optional shareable artefact, and a chance to stop. A deliberate stopping point is part of good learning design. The product should not optimise for keeping the learner in an endless chat.
