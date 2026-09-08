import type { Rubric } from "../types";

/** Rubrics shared across item families. */
export const sharedRubrics: Rubric[] = [
  {
    id: "RUB-selected-single", version: 1, supportingRequired: 0,
    criteria: [{ id: "S1", label: "Selects the correct option", critical: true, cues: [], antiCues: [] }],
  },
];
