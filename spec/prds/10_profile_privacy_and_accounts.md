# PRD-10: Learner control, accounts and privacy

Release: R1 core | Accountable function: Product + backend + security

## Problem and desired outcome

A product using CVs and learning evidence must give users understandable control and prevent information from leaking across accounts or public shares.

## User story

As a learner, I want to control what the product remembers, correct it, save progress and remove my data.

## Entry and exit flow

Guest onboarding precedes an optional save-progress account step. S10 separates experience context, preferences, work and account controls.

## Functional requirements and acceptance tests

### P10-F01

Offer account creation after meaningful first feedback. Claim a guest session atomically; require authentication before merging with an existing account and show a conflict preview.

**P10-AC01 — Acceptance:** Claim the same guest session twice or from a different account. Only one authorised transfer succeeds; existing goal state is not overwritten silently.

### P10-F02

Make profile facts editable and removable with source labels. Allow all personal examples to be disabled while retaining access to the learning product.

**P10-AC02 — Acceptance:** Remove an employer fact. Future context packets omit it and dependent pending examples are invalidated; unrelated graded work remains.

### P10-F03

Proposed retention defaults: raw CV objects and full extracted raw text removed within 24 hours of upload; unclaimed guest records expire after seven days. Confirmed teaching facts and work remain while an account is active until removed.

**P10-AC03 — Acceptance:** Advance a retention test clock beyond each deadline. Raw objects/text and expired guest derivatives, including queues and caches, become inaccessible and are scheduled for deletion consistently.

### P10-F04

Account deletion immediately revokes access and share links; remove primary user content within 24 hours and age out backups within 30 days under the chosen storage policy. Confirm exact provider support before launch.

**P10-AC04 — Acceptance:** Delete an account with work, uploads, cached lessons and shares. A deletion job covers every owned object type; old share tokens stop resolving immediately.

### P10-F05

Export context, goals, work and learning evidence in a documented machine-readable structure plus readable summaries. Exclude internal secrets and other users' data.

**P10-AC05 — Acceptance:** Export an account containing two goal versions. Both goals and their evidence references are present and every referenced owned work item resolves.

### P10-F06

Restrict service and reviewer access by role, purpose and audit trail. Do not send full CVs or raw answers to general analytics. Provider training and retention settings must be selected and disclosed before live use.

**P10-AC06 — Acceptance:** Inspect analytics and standard application logs after onboarding and grading. They contain IDs/statuses, not CV bodies, contact details or full learner answers.

### P10-F07

Keep reminders optional and separate from essential service messages. Privacy copy describes actual behaviour and is reviewed against the selected deployment before public launch.

**P10-AC07 — Acceptance:** Decline reminders and disable personal examples. Learning works normally and no reminder is scheduled.

## States and recovery

Guest, claim pending, authenticated, merge conflict, export pending, deletion pending and deleted.

## Data and analytics

User, GuestSession, ConsentPreference, ProfileFact, ExportJob, DeletionJob, AccessAudit. Events: account_created, guest_claimed, context_disabled, export_requested, deletion_requested; never log private payloads.

## Success measures and guardrails

Data-control task completion, deletion job completion, unauthorised access incidents and profile correction success. These are product requirements, not a legal compliance certification.

## Dependencies

All persistence features; hosting/provider capabilities confirmed before launch.

## Out of scope

Selling CV data, public enrichment, advertising profiles, automatic employer access and legal claims of compliance without review.

## Definition of done

Every acceptance case above has a recorded pass or documented release blocker. The relevant mobile and desktop flow is reviewed with realistic fixture data. Required server-side behaviour is implemented rather than mocked silently. Source, prompt and policy versions are retained where applicable. The release status is updated in the implementation traceability report; a feature is not complete solely because its screen exists.
