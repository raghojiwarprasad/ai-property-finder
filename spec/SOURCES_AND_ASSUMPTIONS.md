# Sources, evidence and assumptions

Prepared 7 September 2026. The product requirements are original design proposals based on the user's supplied discussion and explicit decisions. They are not validated user research or claims about an existing implementation.

## Inputs from the user

AI-only subject; CV then goal onboarding; examples drawn from actual experience; different destinations and depth for different learners; nontechnical learners can aim for research; adaptation from answers, assignments, feedback and simulation behaviour; agent building secondary; simple product flow; dissatisfaction with the previous build; career trajectory explicitly excluded.

The earlier Atlas handoff was reviewed for continuity and limitations. It is not the implementation authority. No Cooper dataset or career graph is needed for this product.

## External references checked

S01 — Institute of Education Sciences, Organizing Instruction and Study to Improve Student Learning: https://ies.ed.gov/ncee/wwc/PracticeGuide/1 . Supports the general use of spaced learning, retrieval, worked examples, concrete/abstract connections and explanatory questions. It does not validate this product's personalisation, thresholds or specific review intervals.

S02 — W3C, Web Content Accessibility Guidelines 2.2: https://www.w3.org/TR/WCAG22/ . Reference for the proposed AA accessibility target. The product's larger interaction targets and visual tokens are design choices; final conformance requires testing the actual implementation.

S03 — OWASP Gen AI Security Project, Prompt Injection: https://genai.owasp.org/llmrisk/llm01-prompt-injection/ . Reference for treating external text as an injection surface. The proposed server controls are product-specific requirements, not a claim that prompting alone prevents attacks.

S04 — Anthropic, Claude Code project memory: https://code.claude.com/docs/en/memory . Reference for project instruction files. Verify current behaviour when setting up a repository.

S05 — Cursor, Rules: https://cursor.com/docs/rules . Reference for persistent project instructions and agent guidance. The handoff remains usable through explicit file-reading prompts without a particular rules configuration.

## Assumptions and unvalidated targets

Adult English-speaking self-directed learners; responsive web first; individual accounts; a modular server application with relational persistence; no fixed vendor or model; five selectable learning destinations with honest coverage; four short complete bundles plus a research starter before the broad pilot; explicit deterministic adaptation before learned optimisation.

Session durations, retention defaults, evidence thresholds, review schedules, performance targets and pilot size are proposed product decisions to test. They are not scientific constants, legal advice, measured metrics or delivery estimates. Confirm storage/provider support and applicable policies before external launch. Pricing, branding and advanced content inventory remain explicit decisions for later evidence.

## What is delivered and what is not

Delivered: product and experience specifications, use cases, detailed PRDs, requirement traceability, learning and engineering contracts, golden lesson examples, visual references and build prompts. Not delivered: a new application, a deployed site, validated learning uplift, production-tested runtime prompts or complete advanced research course content.
