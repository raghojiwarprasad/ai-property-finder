# Start here: personalised AI learning

Prepared for Prasad Raghojiwar | Product specification v1.0 | 7 September 2026

This package defines a new product direction and implementation contract. It is not a report claiming that the proposed product already exists. No application was built or changed in preparing it. The earlier Atlas ZIP is optional reference material, not the design or architecture authority for the new build.

## The product in one sentence

Upload your CV, tell us what you want to achieve with AI, and follow a learning experience that uses your background to make concepts meaningful and your actual work to decide what comes next.

The product teaches AI and the supporting foundations required by the learner's goal. Career trajectory, job matching, salaries, hiring predictions, professional networking and Cooper integration are excluded from this specification and every release described here.

## Read in this order

1. `PRODUCT_DECISIONS.md`: the decisions a builder must preserve.
2. `AI-Learning-Product-Blueprint.docx`: the illustrated product blueprint.
3. `01_PRODUCT_VISION.md` and `02_END_TO_END_EXPERIENCE.md`: what the experience must accomplish.
4. `03_UX_AND_SCREEN_SPEC.md` and `design/`: exactly how the interface should behave and look.
5. `06_USE_CASES.md` and `examples/`: concrete differences between learners, lessons and outcomes.
6. Relevant files in `prds/`: functional requirements, failure states and acceptance criteria.
7. `04_PERSONALISATION_AND_ADAPTATION.md`, `05_CURRICULUM_AND_CONTENT_SYSTEM.md`, and `08_ARCHITECTURE_AND_DATA.md`: the learning and engineering contracts.
8. `09_MEASUREMENT_AND_LAUNCH.md` and `10_BUILD_SEQUENCE.md`: what to implement first and how to decide it works.

The Word document is a readable product overview with visual references. The Markdown PRDs, contracts and examples are the implementation authority for detailed behaviour. Requirements have stable IDs to make review and testing traceable. Product performance numbers are proposed targets, not measured results or industry benchmarks.

## Use with Claude Code or Cursor

Unzip this directory into a new project as `spec/`. Open the project in your coding tool and paste `prompts/00_MASTER_BUILD_PROMPT.md`. Give the tool filesystem access to the entire directory; do not paste a ZIP filename into a chat and assume its contents were read. For Claude in a browser, attach the relevant documents and work through the same stages, then transfer the code to a runnable repository.

Optional project instruction templates live in `builder-instructions/`. Copy their contents into your project's instruction files only after reconciling existing instructions. They are templates, not permission to overwrite another project's rules. The staged prompts work without installing any particular plugin.

Start with the design and the complete first learning loop. The prompt sequence deliberately prevents a coding assistant from producing a large landing page, a generic course dashboard, or a dozen disconnected tools while the actual learning remains a stub.

## Interpretation rules

“Must” defines release acceptance. “Should” describes a preferred implementation that can change with a documented reason. “Later” is outside the initial release. Resolve conflicts in favour of the user's latest instructions, then `PRODUCT_DECISIONS.md`, then the specific PRD, then examples. Screen drawings illustrate those decisions; they do not override the behavioural requirements.

No claim of AGI, guaranteed expertise, guaranteed learning speed or viral growth is authorised by this package. The ambition is exceptional learning, demonstrated through user work and measured outcomes.
