import type { Lesson } from "../types";

/**
 * Golden lesson 01: vertical and horizontal AI, with a short AI / ML / generative AI concept block.
 * Source: spec/examples/01_GOLDEN_LESSON_VERTICAL_HORIZONTAL_AI.md. All products are fictional.
 */
export const lessonF01: Lesson = {
  id: "LES-F01-vertical-horizontal", version: 1, capabilityId: "F01", depth: "explain",
  title: "Broad tools and built-for-purpose tools.",
  outcome: "Tell a broad AI capability from a domain-specific AI application, explain what does and does not separate them, and place AI, machine learning and generative AI in relation to each other.",
  prerequisites: [],
  bridges: [
    {
      domain: "supplier_comparison", requiresFactTypes: ["action"], keywords: ["supplier", "bid", "quote", "procure", "vendor", "purchase", "tender"],
      scenarioLabel: "imagined",
      text: "You have compared bids and know the difference between a general spreadsheet and a system built for one kind of tender. Imagine a team using one AI assistant for everything, and a separate product built around tender review. The scenario below is fictional.",
      analogyLimit: "A spreadsheet and an estimating system run different software. Here the two AI products may run the same model; the difference is what is built around it, not what is inside.",
    },
    {
      domain: "operations", requiresFactTypes: ["action", "role"], keywords: ["operations", "coordinat", "logistic", "schedule", "delivery", "project"],
      scenarioLabel: "imagined",
      text: "You have used general tools for many jobs and specialised tools for one. Imagine the AI version of that choice: a general assistant against a product built around one workflow. The scenario below is fictional.",
      analogyLimit: "A specialised physical tool is usually better at its one job. A specialised AI product is not automatically more accurate; that has to be tested separately.",
    },
    {
      domain: "leadership", requiresFactTypes: ["role"], keywords: ["lead", "manager", "director", "head of", "founder", "ceo", "board", "strategy"],
      scenarioLabel: "imagined",
      text: "You have been offered both general software and products built for your sector. Imagine two AI pitches: a broad assistant and a domain-specific review product. The scenario below is fictional.",
      analogyLimit: "In software buying, 'built for your sector' often means different code. In AI it may mean the same model with a different workflow, data and checks, so the question to ask is what was built around the model.",
    },
    {
      domain: "marketing", requiresFactTypes: ["action", "role"], keywords: ["campaign", "marketing", "brand", "audience", "copy", "email"],
      scenarioLabel: "imagined",
      text: "You have used general writing tools and tools built for one channel. Imagine an AI assistant that drafts anything, and a product built around one domain's document review. The scenario below is fictional.",
      analogyLimit: "A channel-specific tool usually has channel-specific data behind it. An AI product's category label says nothing about whether its output is accurate.",
    },
    {
      domain: "software", requiresFactTypes: ["tool", "role", "action"], keywords: ["python", "api", "software", "developer", "engineer", "code", "http", "web service"],
      scenarioLabel: "imagined",
      text: "You have built different applications on the same library. Imagine two AI products on the same model: a general assistant and a tender-review workflow with validation and routing. The scenario below is fictional.",
      analogyLimit: "Sharing a library means sharing behaviour you can rely on. Sharing a model means sharing a component whose output still has to be checked in each application.",
    },
    {
      domain: "general", requiresFactTypes: [], keywords: [],
      scenarioLabel: "imagined",
      text: "Imagine a team that uses one AI assistant to draft emails and summarise notes, and a separate product built around reviewing construction tenders. The scenario below is fictional.",
      analogyLimit: null,
    },
  ],
  simplerExplanation:
    "A horizontal AI product does a broad job for anyone: drafting, summarising, rewriting. A vertical AI product is built around one field's work: its documents, its rules, its approval steps. The same model can sit inside both. The label tells you what the product is built around, not whether it is accurate or worth buying. And 'AI' is the wide word: machine learning is AI that learns from data, and generative AI is machine learning that produces new text, images or code.",
  deeperExplanation:
    "Horizontal and vertical describe the application layer, not the model. A horizontal product exposes general capabilities (drafting, summarising, answering) across many contexts. A vertical product wraps a model in domain-specific workflow, data, validation and integrations: required document structures, comparison against requirements, routing of exceptions to a human reviewer. Neither category requires a different foundational model; a vertical product may use domain data, retrieval, schema validation and integrations, but not every vertical product contains all of these, and the boundary is graded rather than sharp. A prompt template alone is shallow specialisation. Category membership carries no information about accuracy or value; both require separate evaluation. Within the wider vocabulary: artificial intelligence is the broad label for systems performing tasks associated with judgement, whether by rules or by learning; machine learning is the subset whose behaviour is fitted from data; generative AI is the subset of machine learning that produces new content rather than a label or a number.",
  misconceptions: [
    { id: "vertical_needs_bigger_model", claim: "Vertical AI needs a more powerful or different underlying model than horizontal AI.", repair: "The same model can power both. What makes a product vertical is the workflow, data, validation and integrations built around the model, not the model itself." },
    { id: "category_implies_accuracy", claim: "Knowing a product is vertical (or horizontal) tells you how accurate or valuable it is.", repair: "The category describes what the product is built around. Accuracy and value need separate evaluation for either category." },
    { id: "template_is_vertical", claim: "Adding an industry prompt template turns a general product into a vertical one.", repair: "A template is a domain-oriented entry point. Without domain workflow, data or validation it is shallow specialisation, and the product stays mainly horizontal." },
    { id: "genai_is_all_ai", claim: "Generative AI and AI are the same thing.", repair: "Generative AI is one kind of machine learning, which is one kind of AI. A spam filter or a route planner is AI without generating any text." },
    { id: "model_is_product", claim: "If two products share a model, they are effectively the same product.", repair: "The model is one component. Products on the same model can differ completely in workflow, data, checks and who reviews the output." },
  ],
  sources: [{ label: "Fictional products", note: "The tender-review product, the general assistant and every product named in the tasks are invented. No real vendor is described." }],
  blocks: [
    { type: "orientation", id: "b1", text: "This lesson takes about ten minutes. You will see two AI products that may share the same model, learn what actually separates them, place three overlapping words (AI, machine learning, generative AI), and then classify three examples yourself." },
    {
      type: "example", id: "b2", heading: "Two products, one model",
      text: "A team uses one AI assistant to draft emails, summarise meeting notes and rewrite reports. Those capabilities are useful across construction, retail, education and many other industries: a horizontal use of AI. A separate product is designed around construction tender review. It understands the required document structure, compares bids against project requirements, flags missing compliance documents and fits into the team's approval process: a vertical AI application. The same underlying model could power both.",
    },
    {
      type: "concept", id: "b3", heading: "What separates them",
      text: "The distinction is mainly the application: workflow, data and domain requirements. It does not mean one uses 'real AI' and the other does not, and it does not require a different or more powerful model. The boundary is fuzzy. A general product can have industry-specific features; a domain product can use general capabilities. A construction prompt template bolted onto a general assistant is a domain entry point, not a domain workflow; how vertical it is depends on how deep the domain functionality goes.",
    },
    {
      type: "concept", id: "b4", heading: "AI, machine learning, generative AI",
      text: "Three overlapping words. AI is the broad label for systems that perform tasks associated with judgement, whether by hand-written rules or by learning. Machine learning is the part of AI whose behaviour is fitted from data rather than written by hand: a model that predicts a delivery delay from past orders. Generative AI is the part of machine learning that produces new content, such as text, images or code, rather than a label or a number. Both products in this lesson use generative AI; the tender-review product may also use non-generative components such as a classifier for document types.",
    },
    {
      type: "concept", id: "b5", heading: "What the category does not tell you",
      text: "A tool that turns rough notes into polished text for any profession is primarily horizontal. A tool that checks tender submissions against required technical documents and routes exceptions to a reviewer is vertical. Neither description proves that the tool is accurate or worth buying; both need separate evaluation. You already know that buying a general spreadsheet and buying a construction estimating system are different decisions. The AI version has the same distinction, plus attention to model errors, evidence and controls.",
    },
    { type: "interaction", id: "b6", itemFamily: "vertical_horizontal_classify" },
    { type: "nextStep", id: "b7", text: "With the landscape in place, the next question is what a confident-sounding answer from either kind of product is actually worth, which is where generation and uncertainty come in." },
  ],
  durationMinutes: [8, 12],
  primaryFamily: "vertical_horizontal_classify",
  transferFamily: "insurance_transfer",
  shortFamily: "quick_ai_ml_genai",
  reviewPrompt: "In two sentences: what makes an AI product vertical rather than horizontal, and what does that label not tell you?",
  status: "published",
};
