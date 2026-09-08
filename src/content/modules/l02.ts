import { lessonL02 } from "./lesson-l02";
import { itemsL02, rubricPilotMemo, rubricMemoCritique } from "./items-l02";
import type { ItemFamily, Lesson, Rubric } from "../types";

export const lessons: Lesson[] = [lessonL02];
export const items: ItemFamily[] = itemsL02;
export const rubrics: Rubric[] = [rubricPilotMemo, rubricMemoCritique];
