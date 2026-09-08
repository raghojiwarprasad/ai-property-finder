import { lessonR01 } from "./lesson-r01";
import { itemsR01, rubricLeakage, rubricInspectionTransfer, rubricAverageActivity } from "./items-r01";
import type { ItemFamily, Lesson, Rubric } from "../types";

export const lessons: Lesson[] = [lessonR01];
export const items: ItemFamily[] = itemsR01;
export const rubrics: Rubric[] = [rubricLeakage, rubricInspectionTransfer, rubricAverageActivity];
