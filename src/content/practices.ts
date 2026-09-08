import type { PracticeTemplate } from "./types";

/**
 * Deterministic simulation templates (PRD-08). Every run is computed by
 * `src/server/services/practice.ts` from the scenario data and the learner's configuration.
 * Nothing here contacts a real service; every "action" is a fictional outcome in a trace.
 */
export const practices: PracticeTemplate[] = [
  {
    id: "PRC-F09-approval-boundary", version: 1, capabilityId: "F09", depth: "apply",
    family: "approval_boundary_sim", kind: "approval_boundary",
    title: "Set the approval boundary for a purchase-order assistant",
    simulates: "A fictional purchase-order assistant processing one day of supplier invoices. Every payment, email and escalation is simulated; nothing leaves this page.",
    objective: "Configure which invoices the assistant may pay automatically and which need a human, so that no unusual payment goes out unchecked while routine work still flows.",
    brief: "The assistant receives a batch of supplier invoices with an amount, a supplier status (known or new) and a confidence score for its own matching of the invoice to a purchase order. You decide the automatic-payment threshold, whether new suppliers ever pay automatically, the minimum matching confidence, and what happens when the assistant is unsure. Then run the day and read the trace.",
    rubricId: "RUB-approval-boundary",
    hints: [
      "Look at which invoices in the trace were paid automatically. Should a human have seen any of them?",
      "A new supplier and a low matching confidence are two different risks; one control does not cover both.",
      "When the assistant is unsure, holding for review costs a little time; paying costs money you cannot recover in the simulation.",
    ],
    scenarios: [
      {
        key: "day_one", title: "A routine Tuesday", description: "Six invoices, one of them from a supplier the company has never used.",
        data: {
          invoices: [
            { id: "INV-101", supplier: "Elm Fixings", amount: 420, newSupplier: false, matchConfidence: 0.97, note: "Matches PO 4471." },
            { id: "INV-102", supplier: "Oak Timber", amount: 1850, newSupplier: false, matchConfidence: 0.91, note: "Matches PO 4468." },
            { id: "INV-103", supplier: "Birch Logistics", amount: 9600, newSupplier: false, matchConfidence: 0.88, note: "Amount is 15% above PO 4470." },
            { id: "INV-104", supplier: "Northgate Supplies", amount: 2300, newSupplier: true, matchConfidence: 0.93, note: "No purchase order on file; bank details supplied in the email." },
            { id: "INV-105", supplier: "Elm Fixings", amount: 95, newSupplier: false, matchConfidence: 0.62, note: "Two candidate purchase orders." },
            { id: "INV-106", supplier: "Oak Timber", amount: 500, newSupplier: false, matchConfidence: 0.99, note: "Matches PO 4472." },
          ],
          /** Invoices that must reach a human for the run to be safe. */
          mustReview: ["INV-103", "INV-104", "INV-105"],
          /** Invoices that are safe to pay automatically; holding all of them is over-restriction. */
          routine: ["INV-101", "INV-102", "INV-106"],
        },
      },
      {
        key: "month_end", title: "Month end", description: "Seven invoices under time pressure, including a duplicate and a large but legitimate one.",
        data: {
          invoices: [
            { id: "INV-201", supplier: "Elm Fixings", amount: 380, newSupplier: false, matchConfidence: 0.98, note: "Matches PO 4490." },
            { id: "INV-202", supplier: "Elm Fixings", amount: 380, newSupplier: false, matchConfidence: 0.98, note: "Same amount and PO as INV-201, received twice." },
            { id: "INV-203", supplier: "Cedar Plant Hire", amount: 14200, newSupplier: false, matchConfidence: 0.95, note: "Matches PO 4485; large but expected." },
            { id: "INV-204", supplier: "Quick Print Co", amount: 640, newSupplier: true, matchConfidence: 0.71, note: "First invoice from this supplier." },
            { id: "INV-205", supplier: "Oak Timber", amount: 2200, newSupplier: false, matchConfidence: 0.55, note: "Line items do not match the PO description." },
            { id: "INV-206", supplier: "Birch Logistics", amount: 1200, newSupplier: false, matchConfidence: 0.96, note: "Matches PO 4488." },
            { id: "INV-207", supplier: "Oak Timber", amount: 310, newSupplier: false, matchConfidence: 0.97, note: "Matches PO 4491." },
          ],
          mustReview: ["INV-202", "INV-203", "INV-204", "INV-205"],
          routine: ["INV-201", "INV-206", "INV-207"],
          duplicates: [["INV-201", "INV-202"]],
        },
      },
    ],
    controls: [
      { id: "autoPayLimit", label: "Automatic payment limit (amount)", type: "number", default: 5000, help: "Invoices at or below this amount may be paid without a human, if the other conditions are met." },
      { id: "newSupplierAuto", label: "New suppliers may be paid automatically", type: "toggle", default: true },
      { id: "minConfidence", label: "Minimum matching confidence for automatic payment", type: "number", default: 0.5, help: "Between 0 and 1. The assistant's own confidence that the invoice matches a purchase order." },
      { id: "unsureAction", label: "When the assistant is unsure", type: "select", default: "pay", options: [
        { value: "pay", label: "Pay anyway and log it" },
        { value: "hold", label: "Hold for human review" },
        { value: "ask_supplier", label: "Email the supplier for clarification" },
      ] },
      { id: "duplicateCheck", label: "Check for duplicate invoices before paying", type: "toggle", default: false },
    ],
    status: "published",
  },
  {
    id: "PRC-F06-retrieval-explorer", version: 1, capabilityId: "F06", depth: "apply",
    family: "retrieval_explorer_sim", kind: "retrieval_explorer",
    title: "Explore what the assistant was given",
    simulates: "A fictional document assistant. You choose which passages it may use and see how the answer changes. No real model is called; the answers are reviewed fixtures for each combination.",
    objective: "See that the answer depends on what was retrieved, then choose a passage set and an unknown-state rule that produce a supported answer.",
    brief: "A colleague asks the assistant: “What is the refund window for damaged items?” The corpus has four passages. Pick which passages the assistant may use and what it must do when the passages do not contain the answer. Run it and read the trace.",
    rubricId: "RUB-retrieval-explorer",
    hints: [
      "Read each passage and ask whether it actually answers the question about damaged items.",
      "If no passage answers the question, the best answer says so. Which rule makes the assistant do that?",
    ],
    scenarios: [
      {
        key: "refund_window", title: "Damaged-item refund", description: "Four passages, one of which is about a different situation.",
        data: {
          question: "What is the refund window for damaged items?",
          passages: [
            { id: "P1", title: "Shipping policy", text: "Orders ship within 2 business days. Delivery estimates are not guarantees.", relevant: false },
            { id: "P2", title: "Returns: unopened items", text: "Unopened items may be returned within 30 days for a full refund.", relevant: false, misleading: true },
            { id: "P3", title: "Returns: damaged items", text: "Report damage within 7 days of delivery with a photo. A replacement or refund is issued after review.", relevant: true },
            { id: "P4", title: "Gift cards", text: "Gift cards are non-refundable.", relevant: false },
          ],
          answers: {
            withRelevant: "Damaged items must be reported within 7 days of delivery with a photo; a replacement or refund follows review. (Source: Returns: damaged items)",
            misleadingOnly: "Damaged items can be refunded within 30 days. (Source: Returns: unopened items)",
            nothingRelevantDecline: "The supplied passages do not state a refund window for damaged items.",
            nothingRelevantGuess: "Damaged items can typically be refunded within 30 days.",
          },
        },
      },
      {
        key: "warranty_claim", title: "Warranty claim", description: "A fresh question with a different corpus.",
        data: {
          question: "How long is the warranty on the kettle?",
          passages: [
            { id: "P1", title: "Toaster warranty", text: "The toaster carries a 24-month warranty.", relevant: false, misleading: true },
            { id: "P2", title: "Kettle care", text: "Descale the kettle monthly in hard-water areas.", relevant: false },
            { id: "P3", title: "Kettle warranty", text: "The kettle carries a 12-month warranty from the date of purchase, excluding limescale damage.", relevant: true },
            { id: "P4", title: "Delivery", text: "Small appliances ship within 3 business days.", relevant: false },
          ],
          answers: {
            withRelevant: "The kettle has a 12-month warranty from purchase, excluding limescale damage. (Source: Kettle warranty)",
            misleadingOnly: "The kettle has a 24-month warranty. (Source: Toaster warranty)",
            nothingRelevantDecline: "The supplied passages do not state the kettle's warranty period.",
            nothingRelevantGuess: "Kettles usually have a 24-month warranty.",
          },
        },
      },
    ],
    controls: [
      { id: "passages", label: "Passages the assistant may use", type: "multiselect", default: ["P1", "P2"], options: [
        { value: "P1", label: "Passage 1" }, { value: "P2", label: "Passage 2" }, { value: "P3", label: "Passage 3" }, { value: "P4", label: "Passage 4" },
      ] },
      { id: "unknownRule", label: "When the passages do not contain the answer", type: "select", default: "best_guess", options: [
        { value: "best_guess", label: "Give the most likely answer" },
        { value: "decline", label: "Say the passages do not contain it" },
      ] },
      { id: "citeSources", label: "Require a source for every statement", type: "toggle", default: false },
    ],
    status: "published",
  },
];

export const practiceRubrics = [
  {
    id: "RUB-approval-boundary", version: 1, supportingRequired: 1,
    criteria: [
      { id: "A1", label: "No unusual invoice is paid without a human", critical: true, cues: [], antiCues: [] },
      { id: "A2", label: "Routine invoices still flow automatically", critical: true, cues: [], antiCues: [] },
      { id: "A3", label: "Uncertainty leads to review rather than payment", critical: false, cues: [], antiCues: [] },
      { id: "A4", label: "Duplicate protection is in place", critical: false, cues: [], antiCues: [] },
    ],
  },
  {
    id: "RUB-retrieval-explorer", version: 1, supportingRequired: 1,
    criteria: [
      { id: "R1", label: "The relevant passage is included", critical: true, cues: [], antiCues: [] },
      { id: "R2", label: "The assistant declines when the passages do not answer", critical: true, cues: [], antiCues: [] },
      { id: "R3", label: "Every statement is sourced", critical: false, cues: [], antiCues: [] },
      { id: "R4", label: "Misleading passages are excluded or outweighed", critical: false, cues: [], antiCues: [] },
    ],
  },
];
