import { z } from "zod";
import { GoalSuggestionSchema } from "./types";

export const goalSuggestions: z.infer<typeof GoalSuggestionSchema>[] = [
  { id: "use", destination: "use", label: "Use AI confidently in my work", text: "Use AI confidently in my work" },
  { id: "lead", destination: "lead", label: "Lead AI decisions", text: "Understand AI well enough to choose good investments and challenge vendors" },
  { id: "build", destination: "build", label: "Build AI applications", text: "Build a reliable AI assistant that answers questions from documents" },
  { id: "marketing", destination: "marketing", label: "Use AI in marketing", text: "Use AI to create better campaigns while keeping claims and brand quality under control" },
  { id: "research", destination: "research", label: "Study AI deeply, including research", text: "Understand AI deeply and eventually do research" },
];
