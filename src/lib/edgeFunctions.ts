/**
 * @file edgeFunctions.ts — Thin wrapper around supabase.functions.invoke
 *
 * Why: our edge functions return structured 429 responses with a
 * `retryAfter` field (seconds) when the rate limiter trips. The default
 * supabase-js `FunctionsHttpError` swallows the body, so callers can't
 * tell a rate-limit from a generic 500. This helper:
 *
 *   1. Calls `supabase.functions.invoke(name, options)`
 *   2. On HTTP error, reads the response body (status + JSON)
 *   3. Surfaces a typed `EdgeFunctionError` with status + retryAfter
 *   4. Auto-toasts friendly messages for the common cases (429, 402,
 *      403). Callers can opt out via `toastOnError: false`.
 *
 * Usage:
 *   const { data, error } = await invokeEdgeFunction('generate-content', {
 *     body: { type, context },
 *   });
 *   if (error) return null;  // toast already shown
 */
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export class EdgeFunctionError extends Error {
  status: number;
  retryAfter?: number; // seconds
  payload?: unknown;

  constructor(message: string, status: number, retryAfter?: number, payload?: unknown) {
    super(message);
    this.name = 'EdgeFunctionError';
    this.status = status;
    this.retryAfter = retryAfter;
    this.payload = payload;
  }
}

interface InvokeOptions {
  body?: unknown;
  headers?: Record<string, string>;
  /** Suppress the auto-toast on error (default: shows toast for known cases). */
  toastOnError?: boolean;
}

interface InvokeResult<T> {
  data: T | null;
  error: EdgeFunctionError | null;
}

/** Format a seconds value into a friendly "X minute(s)" / "Y second(s)" string. */
function formatRetryAfter(seconds: number): string {
  if (seconds <= 1) return 'a moment';
  if (seconds < 60) return `${seconds} seconds`;
  const mins = Math.ceil(seconds / 60);
  return mins === 1 ? '1 minute' : `${mins} minutes`;
}

/**
 * Invoke an edge function and normalise its error shape. Toasts a friendly
 * message on 429 / 402 / 403 unless `toastOnError: false`.
 */
export async function invokeEdgeFunction<T = unknown>(
  name: string,
  options: InvokeOptions = {},
): Promise<InvokeResult<T>> {
  const { toastOnError = true, ...invokeOpts } = options;

  try {
    const { data, error } = await supabase.functions.invoke(name, invokeOpts as never);

    if (error) {
      // FunctionsHttpError exposes the raw Response via `context`.
      const ctx = (error as { context?: Response }).context;
      let status = 0;
      let payload: unknown = undefined;

      if (ctx && typeof ctx.clone === 'function') {
        status = ctx.status;
        try {
          payload = await ctx.clone().json();
        } catch {
          // body might be empty or non-JSON; that's fine
        }
      }

      const retryAfter =
        typeof (payload as { retryAfter?: number })?.retryAfter === 'number'
          ? (payload as { retryAfter: number }).retryAfter
          : undefined;

      const message =
        (payload as { error?: string })?.error ||
        error.message ||
        `Request failed (${status || 'network'})`;

      const edgeError = new EdgeFunctionError(message, status, retryAfter, payload);

      if (toastOnError) {
        toastEdgeError(name, edgeError);
      }

      return { data: null, error: edgeError };
    }

    // Some functions return { error: "..." } with a 200 status. Treat as error.
    if (data && typeof data === 'object' && 'error' in data && (data as { error: unknown }).error) {
      const message = String((data as { error: unknown }).error);
      const edgeError = new EdgeFunctionError(message, 200, undefined, data);
      if (toastOnError) toastEdgeError(name, edgeError);
      return { data: null, error: edgeError };
    }

    return { data: data as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    const edgeError = new EdgeFunctionError(message, 0);
    if (toastOnError) toastEdgeError(name, edgeError);
    return { data: null, error: edgeError };
  }
}

/** Friendly toast for known edge-function failure shapes. */
function toastEdgeError(fnName: string, err: EdgeFunctionError) {
  // 429 — rate limited
  if (err.status === 429) {
    const wait = err.retryAfter ? formatRetryAfter(err.retryAfter) : 'a moment';
    toast.error('Slow down a bit', {
      description: `You've hit the request limit for this feature. Try again in ${wait}.`,
    });
    return;
  }

  // 402 — Lovable AI credits exhausted
  if (err.status === 402) {
    toast.error('AI usage limit reached', {
      description: 'The platform has hit its AI quota. Please contact support or try again later.',
    });
    return;
  }

  // 403 — auth / role issue
  if (err.status === 403) {
    toast.error('Not allowed', {
      description: err.message || "You don't have access to this action.",
    });
    return;
  }

  // Fallback
  toast.error('Something went wrong', {
    description: err.message || `Failed to call ${fnName}. Please try again.`,
  });
}