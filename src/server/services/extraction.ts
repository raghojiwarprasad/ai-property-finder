/**
 * Deterministic experience extraction (PRD-01 F03/F04).
 *
 * Used as the development fixture and as a validator for model output: every fact must
 * quote an exact span of the source text, contact details are discarded, and instructions
 * embedded in the document are treated as data.
 */

export type ExtractedFact = {
  factType: "role" | "action" | "project" | "tool" | "constraint" | "domain" | "education" | "outcome";
  value: string;
  sourceSpan: string;
  confidence: "low" | "medium" | "high";
};

const CONTACT_PATTERNS = [
  /[\w.+-]+@[\w-]+\.[\w.-]+/g, // email
  /\+?\d[\d\s().-]{7,}\d/g, // phone
  /\b(?:linkedin\.com|github\.com|twitter\.com|x\.com)\/\S+/gi,
  /\b(?:date of birth|dob|born on|nationality|passport|marital status|religion)\b[^\n]*/gi,
  /\bhttps?:\/\/\S+/gi,
];

const INJECTION_PATTERNS = [
  /ignore (all |any |the |previous |prior )?(instructions|rules|prompts?)/i,
  /\bmark (me|this|the (candidate|learner)) (as )?(expert|complete|passed|proficient)/i,
  /\byou are now\b/i,
  /\bsystem prompt\b/i,
  /\bgrant (me|the user)\b/i,
  /\bassistant:\s/i,
];

const ACTION_VERBS = [
  "coordinated", "compared", "managed", "led", "built", "designed", "developed", "negotiated", "tracked", "analysed", "analyzed",
  "organised", "organized", "planned", "reviewed", "approved", "tested", "wrote", "created", "maintained", "launched", "ran",
  "evaluated", "measured", "trained", "taught", "supported", "delivered", "implemented", "researched", "studied", "helped",
  "scheduled", "monitored", "reported", "processed", "handled", "prepared", "assessed", "audited", "used",
  "coordinate", "compare", "manage", "lead", "build", "design", "develop", "negotiate", "track", "analyse", "analyze", "organise", "organize",
  "plan", "review", "approve", "test", "write", "create", "maintain", "launch", "run", "evaluate", "measure", "train", "teach", "support",
  "deliver", "implement", "research", "study", "help", "schedule", "monitor", "report", "process", "handle", "prepare", "assess", "audit", "use",
];

const TOOL_TERMS = [
  "python", "javascript", "typescript", "sql", "excel", "spreadsheets", "spreadsheet", "power bi", "tableau", "salesforce", "hubspot",
  "figma", "jira", "sap", "oracle", "aws", "azure", "docker", "react", "django", "flask", "http apis", "rest apis", "apis", "git",
  "google analytics", "mailchimp", "photoshop", "autocad", "revit", "pandas", "tensorflow", "pytorch", "scikit-learn",
];

const DOMAIN_TERMS: Record<string, string[]> = {
  "construction": ["construction", "site", "contractor", "tender", "bid", "building"],
  "operations": ["operations", "logistics", "supply chain", "procurement", "purchase order", "supplier", "warehouse", "delivery", "dispatch"],
  "marketing": ["marketing", "campaign", "brand", "audience", "email campaign", "segmentation", "copy"],
  "software": ["software", "web service", "backend", "frontend", "api", "engineer", "developer", "deployment"],
  "leadership": ["ceo", "director", "founder", "managing director", "head of", "budget", "board", "p&l", "service quality"],
  "research": ["research", "thesis", "publication", "experiment", "laboratory", "phd", "master's", "dissertation"],
  "healthcare": ["hospital", "clinic", "patient", "nurse", "care"],
  "education": ["teacher", "school", "curriculum", "students", "tutor"],
  "finance": ["accounting", "invoice", "audit", "finance", "bookkeeping"],
  "community": ["volunteer", "community", "event", "charity", "club"],
};

const EDUCATION_PATTERNS = [
  /\b(mba|bsc|ba|msc|ma|phd|b\.?tech|b\.?e\.?|m\.?tech|diploma|degree|bachelor(?:'s)?|master(?:'s)?|doctorate)\b[^.\n]{0,80}/gi,
  /\b(studied|graduated|completed)\b[^.\n]{0,100}/gi,
];

const ROLE_PATTERNS = [
  /\b(project (?:manager|coordinator)|operations (?:manager|coordinator|lead)|marketing (?:manager|executive|lead)|software (?:engineer|developer)|web developer|data (?:analyst|scientist)|product manager|ceo|chief executive|founder|director|head of [a-z]+|team lead|analyst|consultant|nurse|teacher|researcher|engineer|developer|coordinator|manager)\b/gi,
];

function sentences(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .split(/(?<=[.!?])\s+|\n{1,}|•|·|•/)
    .map((s) => s.replace(/^[\s\-–*]+/, "").trim())
    .filter((s) => s.length >= 8);
}

export function stripContactDetails(text: string): string {
  let out = text;
  for (const p of CONTACT_PATTERNS) out = out.replace(p, " ");
  return out;
}

export function detectInjection(text: string): string[] {
  return INJECTION_PATTERNS.filter((p) => p.test(text)).map((p) => p.source);
}

export function extractFactsDeterministic(rawText: string): { facts: ExtractedFact[]; ambiguities: string[]; injectionDetected: boolean } {
  const cleaned = stripContactDetails(rawText).slice(0, 80_000);
  const injectionDetected = detectInjection(cleaned).length > 0;
  const facts: ExtractedFact[] = [];
  const ambiguities: string[] = [];
  const seen = new Set<string>();
  const push = (f: ExtractedFact) => {
    const k = `${f.factType}:${f.value.toLowerCase()}`;
    if (seen.has(k) || facts.length >= 12) return;
    seen.add(k);
    facts.push(f);
  };

  for (const s of sentences(cleaned)) {
    const lower = s.toLowerCase();
    // Instruction-like sentences are excluded from teaching context entirely.
    if (INJECTION_PATTERNS.some((p) => p.test(s))) continue;
    const span = s.length > 220 ? s.slice(0, 220) : s;

    // Actions: verb-led clauses, the most useful teaching context.
    let verb: string | null = null;
    let idx = Number.MAX_SAFE_INTEGER;
    for (const v of ACTION_VERBS) {
      const m = new RegExp(`\\b${v}\\b`, "i").exec(lower);
      if (m && m.index < idx) { verb = v; idx = m.index; }
    }
    if (verb) {
      const clause = s.slice(idx).split(/[;,.]/)[0].trim();
      if (clause.length >= 12 && clause.length <= 140) {
        const value = clause.charAt(0).toUpperCase() + clause.slice(1);
        push({ factType: "action", value, sourceSpan: span, confidence: clause.length > 20 ? "high" : "medium" });
      }
    }
    for (const p of ROLE_PATTERNS) {
      for (const m of s.matchAll(p)) {
        const role = m[0];
        if (role.length < 4) continue;
        push({ factType: "role", value: role.charAt(0).toUpperCase() + role.slice(1), sourceSpan: span, confidence: "medium" });
        break;
      }
    }
    for (const t of TOOL_TERMS) {
      if (new RegExp(`\\b${t.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(lower)) push({ factType: "tool", value: t.trim().replace(/\b\w/g, (c) => c.toUpperCase()), sourceSpan: span, confidence: "medium" });
    }
    for (const [domain, terms] of Object.entries(DOMAIN_TERMS)) {
      if (terms.some((t) => lower.includes(t))) push({ factType: "domain", value: domain.charAt(0).toUpperCase() + domain.slice(1), sourceSpan: span, confidence: "low" });
    }
    for (const p of EDUCATION_PATTERNS) {
      const m = s.match(p);
      if (m) {
        push({ factType: "education", value: m[0].trim().slice(0, 100), sourceSpan: span, confidence: "medium" });
        break;
      }
    }
  }

  if (facts.filter((f) => f.factType === "action").length === 0) {
    ambiguities.push("No specific activities were found. Examples will start general until you add a task or project you know well.");
  }
  return { facts, ambiguities, injectionDetected };
}

/** Validates model-extracted facts against the source: spans must appear verbatim; contact-like values are dropped. */
export function validateFactsAgainstSource(facts: ExtractedFact[], source: string): { accepted: ExtractedFact[]; rejected: number } {
  const normalised = source.replace(/\s+/g, " ").toLowerCase();
  const accepted: ExtractedFact[] = [];
  let rejected = 0;
  for (const f of facts) {
    const span = f.sourceSpan.replace(/\s+/g, " ").toLowerCase();
    const isContact = CONTACT_PATTERNS.some((p) => new RegExp(p.source, p.flags.replace("g", "")).test(f.value));
    const isInjected = INJECTION_PATTERNS.some((p) => p.test(f.value) || p.test(f.sourceSpan));
    if (!normalised.includes(span) || isContact || isInjected) {
      rejected += 1;
      continue;
    }
    accepted.push(f);
  }
  return { accepted, rejected };
}
