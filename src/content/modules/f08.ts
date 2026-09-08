import { lessonF08 } from "./lesson-f08";
import { itemsF08, rubricCriteriaDesign, rubricApplyTransfer } from "./items-f08";
import type { ItemFamily, Lesson, Rubric } from "../types";

export const lessons: Lesson[] = [lessonF08];
export const items: ItemFamily[] = itemsF08;
export const rubrics: Rubric[] = [rubricCriteriaDesign, rubricApplyTransfer];
