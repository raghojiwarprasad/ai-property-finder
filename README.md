# Learn AI

A personalised AI learning product built from the specification in `spec/` (Prasad Raghojiwar, v1.0, September 2026).

> Upload your CV or describe your experience, choose what you want to do with AI, and follow a learning
> experience that uses your background to make concepts meaningful and your actual work to decide what comes next.

The product teaches AI and the supporting foundations required by the learner's goal. Career trajectory, job
matching, salaries, hiring predictions and professional networking are out of scope by design.

**Read `IMPLEMENTATION_STATUS.md` before assuming anything is production-ready.** It maps every requirement
ID to what is implemented, fixture-only, provider-unverified, content-planned or outside this release.

## Run it locally

Requirements: Node 22+. No database server is needed; an embedded PostgreSQL (PGlite) is created in `./data/pglite`.

```bash
npm install
npm run dev            # http://localhost:3000
```

Without a model provider key the app runs in **labelled development fixture mode**: personal examples come from
reviewed templates, tutoring answers are assembled from lesson text, and written work is graded by a reviewed
deterministic cue checker. Every such surface says so in the interface.

To use a live model provider, copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`. The gateway
(`src/server/gateway/`) then calls the Anthropic SDK for CV extraction, goal interpretation, lesson adaptation,
tutoring and written evaluation, with schema validation, span checks, timeouts, one retry and a redacted cost
ledger. **The live path has not been exercised in this repository** (no key was available); see the status file.

To use a server PostgreSQL instead of the embedded database, set `DATABASE_URL`. Migrations in `drizzle/` run on start.

## Checks

```bash
npm run typecheck
npm run lint
npm test               # vitest: content evaluation set, learning loop, ownership, retention, sharing, simulations
npm run test:e2e       # builds, then Playwright at 1440px and 390px (screenshots in e2e-results/screenshots)
npm run content:validate
```

## Layout

| Path | What it is |
| --- | --- |
| `spec/` | The product specification package (authority for behaviour) |
| `src/content/` | Reviewed, versioned curriculum: capabilities, milestones, lessons, item families, rubrics, simulations, validator |
| `src/server/db/` | Drizzle schema and database handle (PGlite or PostgreSQL) |
| `src/server/services/` | Identity, experience, goals, learning policy, assessment, tutor, practice, work, privacy, sharing |
| `src/server/gateway/` | Model gateway: task types, prompt contracts, fixtures |
| `src/app/api/` | JSON route handlers (the API surface in `spec/08_ARCHITECTURE_AND_DATA.md`) |
| `src/app/(public)/` | Arrival, sample lesson, onboarding, account, shared pages |
| `src/app/(app)/` | Today, My path, My work, lesson player, practice, profile, settings, help |
| `tests/`, `e2e/` | Vitest suite and Playwright flow |
| `scripts/` | Content validation and the retention sweeper |

## Operations notes

- Retention: run `npm run retention:sweep` on a schedule (or `POST /api/ops/retention-sweep` with `x-ops-token`).
  Raw uploads are purged after 24 hours, unclaimed guests after 7 days.
- Appeals are recorded and shown as provisional; a reviewer resolves them with `resolveAppeal()` in
  `src/server/services/assessment.ts`. There is no reviewer interface yet.
- Uploads are stored privately under `./data/uploads` (or `UPLOAD_DIR`). Nothing is served publicly.
