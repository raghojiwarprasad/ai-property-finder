import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { getDb, schema } from "@/server/db";
import { config, newId } from "@/server/lib/util";
import { PROMPTS, SHARED_SYSTEM, type TaskType } from "./prompts";
import { fixtureFor } from "./fixtures";

/**
 * Model gateway (spec/08_ARCHITECTURE_AND_DATA.md "Model gateway").
 *
 * - Explicit task types with separate schemas and prompt versions.
 * - Minimal context packets only; callers never pass whole records.
 * - Structured output validated with zod; invalid output is an error, never a silent pass.
 * - Timeout, cancellation, one retry on transient failure, and a redacted cost ledger.
 * - Fixture mode is explicit and labelled: `mode: "fixture"` means no model was called.
 */

export type GatewayMode = "live" | "fixture";

export class GatewayError extends Error {
  constructor(public readonly errorClass: "timeout" | "invalid_output" | "refusal" | "unavailable" | "cancelled" | "rate_limited", message: string) {
    super(message);
  }
}

export type GatewayResult<T> = { mode: GatewayMode; output: T; promptVersion: string; model: string; requestId: string };

export function gatewayMode(): GatewayMode {
  const explicit = process.env.AI_MODE;
  if (explicit === "fixture") return "fixture";
  if (explicit === "live") return "live";
  return process.env.ANTHROPIC_API_KEY ? "live" : "fixture";
}

const MODEL = process.env.AI_MODEL ?? "claude-opus-5";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ timeout: config.modelTimeoutMs, maxRetries: 0 });
  return client;
}

const transient = (err: unknown) =>
  err instanceof Anthropic.APIConnectionError ||
  err instanceof Anthropic.InternalServerError ||
  (err instanceof Anthropic.APIError && err.status === 529);

export async function runTask<T extends TaskType>(
  taskType: T,
  input: z.infer<(typeof PROMPTS)[T]["input"]>,
  opts: { learnerId: string | null; signal?: AbortSignal; forceMode?: GatewayMode },
): Promise<GatewayResult<z.infer<(typeof PROMPTS)[T]["output"]>>> {
  const spec = PROMPTS[taskType];
  const parsedInput = spec.input.parse(input);
  const mode = opts.forceMode ?? gatewayMode();
  const requestId = newId("air");
  const started = Date.now();
  const ledger = async (status: string, extra: Partial<typeof schema.aiRequests.$inferInsert> = {}) => {
    const db = await getDb();
    await db.insert(schema.aiRequests).values({
      id: requestId, learnerId: opts.learnerId, taskType, promptVersion: spec.version, model: mode === "live" ? MODEL : "fixture",
      providerMode: mode, status, latencyMs: Date.now() - started, ...extra,
    });
  };

  if (mode === "fixture") {
    const output = fixtureFor(taskType, parsedInput as never);
    const validated = spec.output.parse(output) as z.infer<(typeof PROMPTS)[T]["output"]>;
    await ledger("ok", { inputTokens: 0, outputTokens: 0 });
    return { mode, output: validated, promptVersion: spec.version, model: "fixture", requestId };
  }

  let attempt = 0;
  for (;;) {
    attempt += 1;
    try {
      const response = await getClient().messages.parse(
        {
          model: MODEL,
          max_tokens: 4000,
          system: [{ type: "text", text: SHARED_SYSTEM + "\n\n" + spec.system, cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: spec.render(parsedInput as never) }],
          output_config: { effort: spec.effort, format: zodOutputFormat(spec.output) },
        },
        { signal: opts.signal, timeout: config.modelTimeoutMs },
      );
      if (response.stop_reason === "refusal") {
        await ledger("refusal", { errorClass: response.stop_details?.category ?? "refusal", inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens });
        throw new GatewayError("refusal", "The model declined this request.");
      }
      const output = response.parsed_output;
      if (!output) {
        await ledger("invalid_output", { errorClass: "unparseable", inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens });
        throw new GatewayError("invalid_output", "The model returned output that did not match the required structure.");
      }
      await ledger("ok", { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens });
      return { mode, output: output as z.infer<(typeof PROMPTS)[T]["output"]>, promptVersion: spec.version, model: MODEL, requestId };
    } catch (err) {
      if (err instanceof GatewayError) throw err;
      if (opts.signal?.aborted) {
        await ledger("cancelled", { errorClass: "cancelled" });
        throw new GatewayError("cancelled", "The request was cancelled.");
      }
      if (err instanceof Anthropic.APIUserAbortError) {
        await ledger("cancelled", { errorClass: "cancelled" });
        throw new GatewayError("cancelled", "The request was cancelled.");
      }
      if (err instanceof Anthropic.RateLimitError) {
        await ledger("rate_limited", { errorClass: "rate_limited" });
        throw new GatewayError("rate_limited", "The model provider is rate limiting requests.");
      }
      const isTimeout = err instanceof Anthropic.APIConnectionTimeoutError;
      if ((isTimeout || transient(err)) && attempt < 2) continue; // at most one automatic retry
      if (isTimeout) {
        await ledger("timeout", { errorClass: "timeout" });
        throw new GatewayError("timeout", "The model did not respond in time.");
      }
      const cls = err instanceof Anthropic.APIError ? `api_${err.status}` : "unknown";
      await ledger("error", { errorClass: cls });
      throw new GatewayError("unavailable", "The model provider is unavailable.");
    }
  }
}
