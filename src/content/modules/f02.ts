import { lessonF02 } from "./lesson-f02";
import { itemsF02, rubricUncertaintyExplain, rubricUncertaintyTransfer } from "./items-f02";
import type { ItemFamily, Lesson, Rubric } from "../types";

export const lessons: Lesson[] = [lessonF02];
export const items: ItemFamily[] = itemsF02;
export const rubrics: Rubric[] = [rubricUncertaintyExplain, rubricUncertaintyTransfer];
