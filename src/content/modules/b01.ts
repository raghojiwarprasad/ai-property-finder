import { lessonB01 } from "./lesson-b01";
import { itemsB01, rubricTraceDiagnosis, rubricTraceSynthesis } from "./items-b01";
import type { ItemFamily, Lesson, Rubric } from "../types";

export const lessons: Lesson[] = [lessonB01];
export const items: ItemFamily[] = itemsB01;
export const rubrics: Rubric[] = [rubricTraceDiagnosis, rubricTraceSynthesis];
