import { lessonM01 } from "./lesson-m01";
import { itemsM01, rubricCampaignBrief, rubricClaimsAudit, rubricVariation } from "./items-m01";
import type { ItemFamily, Lesson, Rubric } from "../types";

export const lessons: Lesson[] = [lessonM01];
export const items: ItemFamily[] = itemsM01;
export const rubrics: Rubric[] = [rubricCampaignBrief, rubricClaimsAudit, rubricVariation];
