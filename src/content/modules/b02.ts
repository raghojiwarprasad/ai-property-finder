import { lessonB02 } from "./lesson-b02";
import { itemsB02, rubricEvaluationSet, rubricEvalSetTransfer } from "./items-b02";
import type { ItemFamily, Lesson, Rubric } from "../types";

export const lessons: Lesson[] = [lessonB02];
export const items: ItemFamily[] = itemsB02;
export const rubrics: Rubric[] = [rubricEvaluationSet, rubricEvalSetTransfer];
