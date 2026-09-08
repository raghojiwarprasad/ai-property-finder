import { lessonF09 } from "./lesson-f09";
import { itemsF09, rubricApprovalPolicy, rubricControlScheduling } from "./items-f09";
import type { ItemFamily, Lesson, Rubric } from "../types";

export const lessons: Lesson[] = [lessonF09];
export const items: ItemFamily[] = itemsF09;
export const rubrics: Rubric[] = [rubricApprovalPolicy, rubricControlScheduling];
