import { lessonF04 } from "./lesson-f04";
import { itemsF04, rubricEvidenceCheck, rubricEvidenceCheckTravel, rubricEvidenceCheckFactsheet } from "./items-f04";
import type { ItemFamily, Lesson, Rubric } from "../types";

export const lessons: Lesson[] = [lessonF04];
export const items: ItemFamily[] = itemsF04;
export const rubrics: Rubric[] = [rubricEvidenceCheck, rubricEvidenceCheckTravel, rubricEvidenceCheckFactsheet];
