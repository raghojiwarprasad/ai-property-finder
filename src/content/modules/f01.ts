import { lessonF01 } from "./lesson-f01";
import { itemsF01, rubricVerticalHorizontal, rubricInsuranceTransfer } from "./items-f01";
import type { ItemFamily, Lesson, Rubric } from "../types";

export const lessons: Lesson[] = [lessonF01];
export const items: ItemFamily[] = itemsF01;
export const rubrics: Rubric[] = [rubricVerticalHorizontal, rubricInsuranceTransfer];
