# Paste this into Claude Code or Cursor

You are implementing a personalised AI learning product from the specification in `spec/`. Read `spec/START_HERE.md`, `spec/PRODUCT_DECISIONS.md`, the vision, the end-to-end experience and the screen specification before writing code. Then read the PRDs relevant to the stage you are implementing.

The product promise is: upload a CV or describe experience, choose an AI goal, then learn through relevant examples and practice that adapts using actual work. Experience controls examples; goal controls destination/depth; evidence controls progression. Never conflate these. The product teaches AI and necessary foundations only. Career trajectory, Cooper integration, job matching, salaries and professional networking are out of scope.

The previous application ZIP is reference material only. I disliked that product. Do not reproduce its interface or assume its design decisions are requirements. Inventory anything reusable and justify reuse. Preserve existing project instructions and data; work in an isolated branch or new project as appropriate.

Start with Stage 1 in `spec/10_BUILD_SEQUENCE.md`. Produce a coherent visual and interaction flow with realistic content from `spec/06_USE_CASES.md` and `spec/examples/`. Show arrival, CV/manual input, goal, a first personalised lesson, a meaningful task, targeted feedback, Today, My path and My work. Use `spec/design/` for visual composition and `spec/03_UX_AND_SCREEN_SPEC.md` for exact behaviour. The main navigation has three destinations: Today, My path and My work.

Keep one primary next action. No generic dashboard full of cards, mandatory long assessment, open-ended chatbot as the whole product, agent builder as the home screen, invented mastery score or artificial biography. A nontechnical learner can choose research and receive real foundations. Show unavailable advanced content as Planned.

Do not silently fake AI functionality. Development fixtures must be labelled. Real CV extraction, model generation, persisted evidence and deterministic simulations need their actual implementations in the appropriate stages. Report whether a path is fixture-only, live-provider-tested or unavailable. Never claim that passing a mocked test proves the live feature works.

For each stage, map work to requirement IDs from `spec/REQUIREMENTS_TRACEABILITY.csv`. Implement relevant loading, error, privacy and mobile states. Use meaningful tests for evidence logic, ownership, retry safety and failure handling. Validate the actual rendered flow as well as the build. Update an implementation status file with factual results and blockers.

Before major implementation, show the concrete Stage 1 design and first-session behaviour for review. After that, proceed through the agreed stages, keeping routine implementation choices autonomous. Follow the execution environment's deployment and approval rules; this prompt does not authorise publishing, spending, contacting people or changing unrelated data.

Begin by summarising the product in five sentences, identifying the core first-session flow and stating the first files you need to inspect. Then complete Stage 1. Do not start by generating a large landing page or installing a complex multi-agent framework.
