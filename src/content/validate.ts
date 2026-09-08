import type { z } from "zod";
import { CatalogueSchema, type Capability, type Catalogue, type Milestone } from "./types";

export type CatalogueInput = z.input<typeof CatalogueSchema>;

export type ContentIssue = { severity: "error" | "warning"; ref: string; message: string };

export type ValidatedCatalogue = Catalogue & {
  issues: ContentIssue[];
  /** Capability ids whose complete evidence path exists (published lesson + enough families + transfer + artefact where required). */
  availableCapabilities: Set<string>;
  /** Milestones with effective status after validation. */
  effectiveMilestones: Milestone[];
};

/**
 * Validates the catalogue (PRD-13 F01/F02): schema, references, prerequisite cycles and
 * complete evidence paths. Milestones whose capabilities lack a complete path are
 * downgraded to Planned rather than silently published.
 */
export function validateCatalogue(raw: CatalogueInput): ValidatedCatalogue {
  const issues: ContentIssue[] = [];
  const parsed = CatalogueSchema.safeParse(raw);
  if (!parsed.success) {
    for (const e of parsed.error.issues) {
      issues.push({ severity: "error", ref: e.path.join("."), message: e.message });
    }
    throw new Error("Content schema invalid:\n" + issues.map((i) => `${i.ref}: ${i.message}`).join("\n"));
  }
  const c = parsed.data;
  const capById = new Map(c.capabilities.map((x) => [x.id, x]));
  const rubricById = new Map(c.rubrics.map((x) => [x.id, x]));
  const lessonsByCap = new Map<string, typeof c.lessons>();
  const itemsByCap = new Map<string, typeof c.items>();
  const itemByFamily = new Map<string, (typeof c.items)[number]>();

  const dupCheck = (ids: string[], kind: string) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) issues.push({ severity: "error", ref: id, message: `duplicate ${kind} id` });
      seen.add(id);
    }
  };
  dupCheck(c.capabilities.map((x) => x.id), "capability");
  dupCheck(c.milestones.map((x) => x.id), "milestone");
  dupCheck(c.lessons.map((x) => x.id), "lesson");
  dupCheck(c.items.map((x) => x.id), "item");
  dupCheck(c.rubrics.map((x) => x.id), "rubric");
  dupCheck(c.practices.map((x) => x.id), "practice");

  for (const cap of c.capabilities) {
    for (const p of cap.prerequisites) {
      if (!capById.has(p)) issues.push({ severity: "error", ref: cap.id, message: `unknown prerequisite ${p}` });
    }
  }
  // Cycle detection
  const visiting = new Set<string>();
  const done = new Set<string>();
  const visit = (id: string, trail: string[]) => {
    if (done.has(id)) return;
    if (visiting.has(id)) {
      issues.push({ severity: "error", ref: id, message: `prerequisite cycle: ${[...trail, id].join(" -> ")}` });
      return;
    }
    visiting.add(id);
    for (const p of capById.get(id)?.prerequisites ?? []) if (capById.has(p)) visit(p, [...trail, id]);
    visiting.delete(id);
    done.add(id);
  };
  for (const cap of c.capabilities) visit(cap.id, []);

  for (const l of c.lessons) {
    if (!capById.has(l.capabilityId)) issues.push({ severity: "error", ref: l.id, message: `unknown capability ${l.capabilityId}` });
    if (!l.bridges.some((b) => b.domain === "general")) issues.push({ severity: "error", ref: l.id, message: "lesson has no general bridge fallback" });
    const arr = lessonsByCap.get(l.capabilityId) ?? [];
    arr.push(l);
    lessonsByCap.set(l.capabilityId, arr);
  }
  for (const it of c.items) {
    if (!capById.has(it.capabilityId)) issues.push({ severity: "error", ref: it.id, message: `unknown capability ${it.capabilityId}` });
    if (!rubricById.has(it.rubricId)) issues.push({ severity: "error", ref: it.id, message: `missing rubric ${it.rubricId}` });
    if (itemByFamily.has(it.family)) issues.push({ severity: "error", ref: it.id, message: `duplicate item family ${it.family}` });
    itemByFamily.set(it.family, it);
    if (it.prompt.kind === "selected") {
      const ids = new Set(it.prompt.options.map((o) => o.id));
      const correct = it.key.correctOptionIds ?? [];
      if (correct.length === 0) issues.push({ severity: "error", ref: it.id, message: "selected item has no correct option" });
      for (const id of correct) if (!ids.has(id)) issues.push({ severity: "error", ref: it.id, message: `correct option ${id} not among options` });
    }
    const arr = itemsByCap.get(it.capabilityId) ?? [];
    arr.push(it);
    itemsByCap.set(it.capabilityId, arr);
  }
  for (const l of c.lessons) {
    for (const fam of [l.primaryFamily, l.transferFamily, l.shortFamily].filter(Boolean) as string[]) {
      const it = itemByFamily.get(fam);
      if (!it) issues.push({ severity: "error", ref: l.id, message: `lesson references unknown item family ${fam}` });
      else if (it.capabilityId !== l.capabilityId) issues.push({ severity: "error", ref: l.id, message: `item family ${fam} belongs to ${it.capabilityId}, lesson is ${l.capabilityId}` });
    }
    const transfer = itemByFamily.get(l.transferFamily);
    if (transfer && transfer.taskKind !== "transfer") issues.push({ severity: "error", ref: l.id, message: `transferFamily ${l.transferFamily} is not a transfer task` });
    for (const b of l.blocks) {
      if (b.type === "interaction" && !itemByFamily.has(b.itemFamily)) issues.push({ severity: "error", ref: l.id, message: `interaction block references unknown family ${b.itemFamily}` });
    }
  }
  for (const p of c.practices) {
    if (!capById.has(p.capabilityId)) issues.push({ severity: "error", ref: p.id, message: `unknown capability ${p.capabilityId}` });
    if (!rubricById.has(p.rubricId)) issues.push({ severity: "error", ref: p.id, message: `missing rubric ${p.rubricId}` });
    if (itemByFamily.has(p.family)) issues.push({ severity: "error", ref: p.id, message: `practice family ${p.family} collides with an item family` });
  }

  // Evidence-path completeness per capability
  const availableCapabilities = new Set<string>();
  for (const cap of c.capabilities) {
    if (cap.status !== "published") continue;
    const reasons = evidencePathGaps(cap, lessonsByCap.get(cap.id) ?? [], itemsByCap.get(cap.id) ?? [], c.practices.filter((p) => p.capabilityId === cap.id && p.status === "published"));
    if (reasons.length === 0) availableCapabilities.add(cap.id);
    else for (const r of reasons) issues.push({ severity: "warning", ref: cap.id, message: `not available: ${r}` });
  }

  const effectiveMilestones = c.milestones.map((m) => {
    for (const id of m.capabilityIds) if (!capById.has(id)) issues.push({ severity: "error", ref: m.id, message: `unknown capability ${id}` });
    if (m.status !== "published") return m;
    const missing = m.capabilityIds.filter((id) => !availableCapabilities.has(id));
    if (missing.length > 0) {
      issues.push({ severity: "warning", ref: m.id, message: `downgraded to planned: incomplete evidence path for ${missing.join(", ")}` });
      return { ...m, status: "planned" as const };
    }
    return m;
  });

  const errors = issues.filter((i) => i.severity === "error");
  if (errors.length > 0) {
    throw new Error("Content validation failed:\n" + errors.map((i) => `${i.ref}: ${i.message}`).join("\n"));
  }
  return { ...c, issues, availableCapabilities, effectiveMilestones };
}

function evidencePathGaps(
  cap: Capability,
  lessons: Catalogue["lessons"],
  items: Catalogue["items"],
  practices: Catalogue["practices"],
): string[] {
  const gaps: string[] = [];
  const published = lessons.filter((l) => l.status === "published");
  if (published.length === 0) gaps.push("no published lesson");
  const publishedItems = items.filter((i) => i.status === "published");
  const families = new Set(publishedItems.map((i) => i.family));
  const contract = cap.evidenceContract;
  const independentFamilies = publishedItems.filter((i) => ["check", "transfer", "explain", "artefact"].includes(i.taskKind));
  if (new Set(independentFamilies.map((i) => i.family)).size < contract.requiredFamilies) {
    gaps.push(`needs ${contract.requiredFamilies} independent item families, has ${families.size}`);
  }
  if (contract.requireTransfer && !publishedItems.some((i) => i.taskKind === "transfer")) gaps.push("no transfer task");
  if (contract.requireArtefact) {
    const hasArtefact = publishedItems.some((i) => i.taskKind === "artefact") || practices.length > 0;
    if (!hasArtefact) gaps.push("applied capability needs an artefact task or a deterministic simulation");
  }
  return gaps;
}
