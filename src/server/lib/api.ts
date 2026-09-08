import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "./errors";
import { assertSameOrigin, clientKey, currentIdentity, requireIdentity } from "./session";
import { checkRateLimit } from "./rateLimit";
import type { Identity } from "@/server/services/identity";

/**
 * Route handler helpers: consistent error envelope, origin check on writes, rate limits,
 * and identity resolution. Errors never leak stack traces or private payloads.
 */

export function jsonError(err: unknown): NextResponse {
  if (err instanceof AppError) return NextResponse.json({ error: { code: err.code, message: err.message, details: err.details ?? null } }, { status: err.status });
  if (err instanceof z.ZodError) return NextResponse.json({ error: { code: "invalid", message: err.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; "), details: null } }, { status: 400 });
  console.error("[api] unexpected", err instanceof Error ? { name: err.name, message: err.message } : err);
  return NextResponse.json({ error: { code: "internal", message: "Something went wrong on our side. Your work is not lost; try again in a moment.", details: null } }, { status: 500 });
}

type HandlerOpts = { write?: boolean; createGuest?: boolean; rateLimit?: { limit: number; windowMs: number; key: string } };

export function handler<T>(opts: HandlerOpts, fn: (ctx: { identity: Identity | null; req: Request; params: Record<string, string> }) => Promise<T>) {
  return async (req: Request, ctx?: { params?: Promise<Record<string, string>> }): Promise<NextResponse> => {
    try {
      if (opts.write) await assertSameOrigin();
      if (opts.rateLimit) checkRateLimit(`${opts.rateLimit.key}:${await clientKey()}`, opts.rateLimit.limit, opts.rateLimit.windowMs);
      const identity = opts.createGuest ? await requireIdentity() : await currentIdentity();
      const params = ctx?.params ? await ctx.params : {};
      const result = await fn({ identity, req, params });
      if (result instanceof NextResponse) return result;
      return NextResponse.json(result);
    } catch (err) {
      return jsonError(err);
    }
  };
}

export function requireLearner(identity: Identity | null): Identity {
  if (!identity) throw new AppError("unauthenticated", "Your session has expired. Start again to continue.", 401);
  return identity;
}

export async function readJson<T extends z.ZodTypeAny>(req: Request, schema: T): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new AppError("invalid", "The request body must be JSON.", 400);
  }
  return schema.parse(body);
}
