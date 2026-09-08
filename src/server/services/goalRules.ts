import type { Destination } from "@/content/types";

/**
 * Reviewed goal mappings (PRD-02). This deterministic interpreter is the development
 * fixture and the fallback when the model interpreter fails; the model may refine the
 * interpretation text but cannot invent destinations or unpublished content.
 */

export type GoalInterpretation = {
  inScope: boolean;
  destination: Destination;
  interpretation: string;
  clarifyingQuestion: string | null;
  aiReformulation: string | null;
  rationale: string;
  provisional: boolean;
};

const AI_TERMS = /\b(ai|a\.i\.|artificial intelligence|machine learning|ml|llm|language model|chatgpt|claude|gpt|copilot|generative|neural|deep learning|model|models|prompt|prompts|assistant|assistants|automation|automate|agent|agents|data science|nlp|computer vision|research|researcher|papers?)\b/i;

const RULES: Array<{ destination: Destination; pattern: RegExp; interpretation: string }> = [
  { destination: "research", pattern: /\b(research|researcher|papers?|phd|academic|deeply|in depth|in-depth|how (models|it|they) (work|learn)|from scratch|theory|mathematics|maths|math)\b/i,
    interpretation: "Understand AI deeply, working towards reading and eventually contributing to research." },
  { destination: "build", pattern: /\b(build|building|develop|developing|code|coding|program|programming|implement|deploy|application|app|assistant that|chatbot|rag|retrieval|api|software|engineer)\b/i,
    interpretation: "Build a reliable AI application that answers questions from documents, with evaluation and boundaries." },
  { destination: "marketing", pattern: /\b(marketing|campaign|campaigns|brand|content|copy|copywriting|audience|ads|advertising|social media|seo|email marketing)\b/i,
    interpretation: "Use AI to create better campaigns while keeping claims and brand quality under control." },
  { destination: "lead", pattern: /\b(lead|leading|leader|leadership|decide|decisions|decision|invest|investments|vendor|vendors|strategy|strategic|executive|ceo|board|budget|pilot|procure|buy|purchase)\b/i,
    interpretation: "Understand AI well enough to choose good investments, run a pilot and challenge vendor claims." },
  { destination: "use", pattern: /\b(use|using|work|job|daily|confident|confidently|productive|productivity|tasks|operations|writing|emails|documents|summar|reports?)\b/i,
    interpretation: "Use AI confidently in your work: state tasks precisely, check outputs against evidence and build repeatable workflows." },
];

const OUT_OF_SCOPE = /\b(marathon|running|fitness|weight|diet|cook|cooking|recipe|guitar|piano|spanish|french|language course|driving|yoga|meditation|gardening|chess)\b/i;

export function interpretGoalRules(goalTextRaw: string): GoalInterpretation {
  const text = goalTextRaw.trim();
  const lower = text.toLowerCase();
  const mentionsAi = AI_TERMS.test(text);

  if (OUT_OF_SCOPE.test(lower) && !mentionsAi) {
    return {
      inScope: false,
      destination: "foundations",
      interpretation: "This goal is outside what the product teaches.",
      clarifyingQuestion: null,
      aiReformulation: `This product teaches AI and its supporting foundations only. If you want, we can start from “Use AI confidently to plan and check work related to ${text.slice(0, 60)}”, or you can write a different AI goal.`,
      rationale: "The goal does not describe learning AI.",
      provisional: false,
    };
  }

  const everything = /\b(everything|all about|all of ai|whole of ai|learn ai|about ai|understand ai)\b/i.test(lower) && !/\b(research\w*|build\w*|market\w*|campaign\w*|lead\w*|decision\w*|invest\w*|vendor\w*|papers?|deeply|application\w*|assistant\w*)\b/i.test(lower);
  if (everything) {
    return {
      inScope: true,
      destination: "foundations",
      interpretation: "Learn the foundations of AI: what it can do, how to check its output, and how to use it with judgement. You can narrow this later.",
      clarifyingQuestion: "What would you most like to be able to do first?",
      aiReformulation: null,
      rationale: "Broad goal; foundations start with one optional clarification.",
      provisional: true,
    };
  }

  for (const rule of RULES) {
    if (rule.pattern.test(lower)) {
      return {
        inScope: true,
        destination: rule.destination,
        interpretation: rule.interpretation,
        clarifyingQuestion: null,
        aiReformulation: null,
        rationale: `Matched the ${rule.destination} destination from the goal wording.`,
        provisional: false,
      };
    }
  }

  return {
    inScope: mentionsAi || lower.length < 60,
    destination: "foundations",
    interpretation: "Learn the foundations of AI and how to use it with judgement, then choose a direction as your goal becomes clearer.",
    clarifyingQuestion: "What would you most like to be able to do first?",
    aiReformulation: mentionsAi ? null : "We could interpret this as an AI foundations goal. Edit the wording if that is not what you meant.",
    rationale: "No specific destination matched; broad foundations proposed as provisional.",
    provisional: true,
  };
}

export const DESTINATION_META: Record<Destination, { label: string; description: string; depth: string }> = {
  use: { label: "Use AI confidently in my work", description: "Task framing, evidence checks, data boundaries, repeatable workflows and personal evaluation.", depth: "apply" },
  lead: { label: "Lead AI decisions", description: "Use-case selection, operational fit, decision criteria, accountability and pilot evaluation.", depth: "analyse" },
  marketing: { label: "Use AI in marketing", description: "Audience evidence, claim verification, creative variation, brand constraints and controlled measurement.", depth: "apply" },
  build: { label: "Build AI applications", description: "Structured outputs, retrieval, evaluations, tool permissions, failure handling and observability.", depth: "build" },
  research: { label: "Study AI deeply, including research", description: "Scientific reasoning, programming, mathematics, learning theory, experiments and critical reading.", depth: "investigate" },
  foundations: { label: "AI foundations", description: "A broad start across the shared foundation capabilities.", depth: "apply" },
};
