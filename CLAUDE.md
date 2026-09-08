# Learn AI — project instructions

This repository implements the personalised AI learning product specified in `spec/`. Read
`spec/PRODUCT_DECISIONS.md` before product changes and the relevant PRD in `spec/prds/` before
implementation. `IMPLEMENTATION_STATUS.md` is the factual record of what is implemented,
fixture-only, provider-unverified, content-planned or production-ready; keep it truthful.

- Scope: AI learning and necessary foundations. Exclude career trajectory, job matching, salaries,
  professional networking and Cooper integration.
- Keep context (profile facts), goal, evidence and preferences distinct. CV facts never award skill.
- Main navigation: Today, My path, My work. One primary next action.
- Personal examples use confirmed facts or clearly labelled imagined scenarios; never invent biography.
- Preserve ambitious goals; vary foundations and support from observed work.
- Models propose language and evaluations; server policy validates and commits state
  (`src/server/services/learning.ts`, `src/server/services/assessment.ts`).
- Answer keys live only in `ItemFamily.key` and never leave the server (`publicItem()` strips them).
- Attempts are immutable and idempotent; every learner-owned object is owner-scoped on the server.
- Label fixtures and incomplete integrations. Never report a mocked provider path as live-tested.
- Use requirement IDs (`spec/REQUIREMENTS_TRACEABILITY.csv`) in implementation status and tests.
- Do not deploy, spend, contact people or modify unrelated data without the required authority.

## Working in this repo

- `npm run dev` (embedded PGlite database in `./data/pglite`, fixture AI mode unless `ANTHROPIC_API_KEY` is set).
- `npm test` runs the vitest suite against an in-memory database; `npm run test:e2e` builds and runs Playwright.
- `npm run content:validate` prints the catalogue, available capabilities and planned milestones.
- Content authoring rules: `src/content/AUTHORING.md`. Published status is decided by the validator, not by hand.
