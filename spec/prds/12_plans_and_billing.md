# PRD-12: Plans and billing

Release: R3 optional after value and cost validation | Accountable function: Product + billing engineering

## Problem and desired outcome

A sustainable product needs a clear exchange of value without interrupting learning or making unsupported promises about unlimited usage.

## User story

As a learner, I want to understand what a paid plan adds and keep access to work I have already created.

## Entry and exit flow

Offer upgrade at a natural boundary after a complete useful loop. Billing and plan state are separate from learning evidence.

## Functional requirements and acceptance tests

### P12-F01

Define the free experience as a complete milestone or equivalent trial with teaching, practice and feedback. Set exact entitlements only after measured costs and willingness-to-pay research.

**P12-AC01 — Acceptance:** A free learner can complete the advertised experience, view the result and export their work without an unexpected feedback paywall.

### P12-F02

Do not block feedback for an already-submitted entitled attempt when a quota or plan changes. Reserve usage at task start and settle it idempotently.

**P12-AC02 — Acceptance:** A plan expires during evaluation. The saved attempt still receives feedback; no duplicate usage is charged on retry.

### P12-F03

Use server-side entitlement checks and verified, idempotent payment webhooks. Do not trust browser success parameters as proof of payment.

**P12-AC03 — Acceptance:** Replay a payment webhook and forge a checkout-success URL. Entitlements change only for the verified event and only once.

### P12-F04

Show limits, renewal terms and cancellation clearly. A cancelled plan retains readable/exportable work; future expensive tasks follow the stated entitlement.

**P12-AC04 — Acceptance:** Cancel renewal. Existing records remain accessible and the interface states when paid activity access ends.

### P12-F05

Price and free allowances remain configurable. Never advertise unlimited model or sandbox usage unless enforceable economics and a clear policy support it.

**P12-AC05 — Acceptance:** Exhaust the configured practice allowance. The product explains the limit before a new costly run, preserves the draft and offers eligible alternatives.

## States and recovery

Free, trial, active, payment pending, past due, cancellation scheduled and expired.

## Data and analytics

Plan, Entitlement, UsageReservation, BillingEvent. Events: upgrade_viewed, checkout_started, subscription_activated, renewal_cancelled; no card data in the application.

## Success measures and guardrails

Paid conversion after demonstrated value, retained learning, gross contribution after variable costs and billing support incidents. Prices are not fixed in this PRD.

## Dependencies

Learning activation validated; provider billing integration selected later; PRD-14 webhook and quota controls.

## Out of scope

Enterprise sales, affiliate lead monetisation, pay-to-improve grades and purchase of credentials.

## Definition of done

Every acceptance case above has a recorded pass or documented release blocker. The relevant mobile and desktop flow is reviewed with realistic fixture data. Required server-side behaviour is implemented rather than mocked silently. Source, prompt and policy versions are retained where applicable. The release status is updated in the implementation traceability report; a feature is not complete solely because its screen exists.
