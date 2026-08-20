import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "@/lib/auth-guard";

/**
 * Wraps a route handler so guard failures and validation errors become clean
 * JSON instead of 500s. Every route in the app should be wrapped in this.
 */
export function handle<A extends unknown[]>(
  fn: (...args: A) => Promise<NextResponse | Response>
) {
  return async (...args: A): Promise<NextResponse | Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: err.issues[0]?.message ?? "Invalid request.", issues: err.issues },
          { status: 400 }
        );
      }
      console.error("Unhandled route error:", err);
      return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }
  };
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/** Parse a JSON body, tolerating an empty one. */
export async function body(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
