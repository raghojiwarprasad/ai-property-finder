import { lessonF06 } from "./lesson-f06";
import { itemsF06, rubricRetrievalTrace, rubricRetrievalTransferOperations } from "./items-f06";
import type { ItemFamily, Lesson, Rubric } from "../types";

export const lessons: Lesson[] = [lessonF06];
export const items: ItemFamily[] = itemsF06;
export const rubrics: Rubric[] = [rubricRetrievalTrace, rubricRetrievalTransferOperations];
