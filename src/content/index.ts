import type { ItemFamily, Lesson, Milestone, PublicItem, Rubric, PracticeTemplate, Capability } from "./types";
import { validateCatalogue, type CatalogueInput, type ValidatedCatalogue } from "./validate";
import { capabilities } from "./capabilities";
import { milestones } from "./milestones";
import { goalSuggestions } from "./goalSuggestions";
import * as f04 from "./modules/f04";
import * as f02 from "./modules/f02";
import * as f03 from "./modules/f03";
import * as f01 from "./modules/f01";
import * as r01 from "./modules/r01";
import * as f06 from "./modules/f06";
import * as f08 from "./modules/f08";
import * as f09 from "./modules/f09";
import * as l01 from "./modules/l01";
import * as l02 from "./modules/l02";
import * as m01 from "./modules/m01";
import * as m02 from "./modules/m02";
import * as b01 from "./modules/b01";
import * as b02 from "./modules/b02";
import { practices, practiceRubrics } from "./practices";
import { sharedRubrics } from "./rubrics/shared";

export const CONTENT_VERSION = "2026.09.1";

type ContentModule = { lessons: Lesson[]; items: ItemFamily[]; rubrics: Rubric[] };
const modules: ContentModule[] = [f04, f02, f03, f01, r01, f06, f08, f09, l01, l02, m01, m02, b01, b02];

const raw: CatalogueInput = {
  contentVersion: CONTENT_VERSION,
  capabilities,
  milestones,
  lessons: modules.flatMap((m) => m.lessons),
  items: modules.flatMap((m) => m.items),
  rubrics: [...sharedRubrics, ...practiceRubrics, ...modules.flatMap((m) => m.rubrics)],
  practices,
  goalSuggestions,
};

let cached: ValidatedCatalogue | null = null;

/** The validated catalogue. Throws at first use if authored content is inconsistent. */
export function getCatalogue(): ValidatedCatalogue {
  if (!cached) cached = validateCatalogue(raw);
  return cached;
}

export function getCapability(id: string): Capability | undefined {
  return getCatalogue().capabilities.find((c) => c.id === id);
}
export function getMilestone(id: string): Milestone | undefined {
  return getCatalogue().effectiveMilestones.find((m) => m.id === id);
}
export function getLesson(id: string): Lesson | undefined {
  return getCatalogue().lessons.find((l) => l.id === id);
}
export function getLessonForCapability(capabilityId: string): Lesson | undefined {
  return getCatalogue().lessons.find((l) => l.capabilityId === capabilityId && l.status === "published");
}
export function getItem(id: string): ItemFamily | undefined {
  return getCatalogue().items.find((i) => i.id === id);
}
export function getItemByFamily(family: string): ItemFamily | undefined {
  return getCatalogue().items.find((i) => i.family === family);
}
export function getItemsForCapability(capabilityId: string): ItemFamily[] {
  return getCatalogue().items.filter((i) => i.capabilityId === capabilityId && i.status === "published");
}
export function getRubric(id: string): Rubric | undefined {
  return getCatalogue().rubrics.find((r) => r.id === id);
}
export function getPractice(id: string): PracticeTemplate | undefined {
  return getCatalogue().practices.find((p) => p.id === id);
}
export function getPracticesForCapability(capabilityId: string): PracticeTemplate[] {
  return getCatalogue().practices.filter((p) => p.capabilityId === capabilityId && p.status === "published");
}
export function isCapabilityAvailable(id: string): boolean {
  return getCatalogue().availableCapabilities.has(id);
}

/** Strips the server-only answer key (PRD-06 F02). */
export function publicItem(item: ItemFamily): PublicItem {
  const { key: _key, ...rest } = item;
  void _key;
  return rest;
}
