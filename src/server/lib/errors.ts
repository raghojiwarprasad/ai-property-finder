export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 400,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export const notFound = (what = "Not found") => new AppError("not_found", what, 404);
export const forbidden = (what = "You do not have access to this record.") => new AppError("forbidden", what, 403);
export const unauthenticated = (what = "Sign in to continue.") => new AppError("unauthenticated", what, 401);
export const invalid = (message: string, details?: Record<string, unknown>) => new AppError("invalid", message, 400, details);
export const conflict = (message: string, details?: Record<string, unknown>) => new AppError("conflict", message, 409, details);
export const rateLimited = () => new AppError("rate_limited", "Too many requests. Please wait a moment and try again.", 429);
