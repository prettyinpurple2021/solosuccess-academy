/**
 * Shared helper for calling the Lovable AI Gateway safely from Edge Functions.
 *
 * WHY THIS EXISTS:
 * - Upstream AI providers can return transient 429/5xx responses during bursts.
 * - Edge Functions only have a limited execution window, so retries must be bounded.
 * - Centralizing the retry logic keeps function files smaller and easier to reason about.
 */

export interface AiGatewayChatCompletionParams {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
}

export interface AiGatewaySuccessResult {
  ok: true;
  data: any;
}

export interface AiGatewayErrorResult {
  ok: false;
  status: number;
  errorText: string;
  retryAfterSeconds: number | null;
}

export type AiGatewayResult = AiGatewaySuccessResult | AiGatewayErrorResult;

/**
 * Retry only transient statuses where waiting briefly can realistically help.
 */
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

/**
 * Keep retry delays short enough to stay inside Edge Function execution limits.
 */
const MAX_RETRY_DELAY_SECONDS = 12;

/**
 * Small sleep helper used between retry attempts.
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Parse Retry-After whether it arrives as seconds or an HTTP date string.
 */
export function parseRetryAfterHeader(headerValue: string | null): number | null {
  if (!headerValue) return null;

  const seconds = Number(headerValue);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds);
  }

  const retryDate = new Date(headerValue);
  if (Number.isNaN(retryDate.getTime())) {
    return null;
  }

  const diffSeconds = Math.ceil((retryDate.getTime() - Date.now()) / 1000);
  return diffSeconds > 0 ? diffSeconds : null;
}

/**
 * Call the AI Gateway with bounded retries.
 *
 * STRATEGY:
 * 1. Respect Retry-After when the provider sends it.
 * 2. Otherwise use exponential backoff with a small jitter.
 * 3. Stop retrying once the attempt budget is exhausted.
 */
export async function requestAiGatewayChatCompletion({
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  temperature = 0.7,
  maxTokens = 16000,
  maxRetries = 3,
}: AiGatewayChatCompletionParams): Promise<AiGatewayResult> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    const responseText = await response.text();

    if (response.ok) {
      try {
        return {
          ok: true,
          data: JSON.parse(responseText),
        };
      } catch (error) {
        console.error("AI gateway success response was not valid JSON:", error);
        return {
          ok: false,
          status: 502,
          errorText: responseText,
          retryAfterSeconds: null,
        };
      }
    }

    const retryAfterSeconds = parseRetryAfterHeader(response.headers.get("Retry-After"));
    const canRetry = RETRYABLE_STATUSES.has(response.status) && attempt < maxRetries;

    console.warn("AI gateway request failed", {
      status: response.status,
      attempt: attempt + 1,
      maxRetries: maxRetries + 1,
      retryAfterSeconds,
      bodyPreview: responseText.slice(0, 500),
    });

    if (!canRetry) {
      return {
        ok: false,
        status: response.status,
        errorText: responseText,
        retryAfterSeconds,
      };
    }

    const fallbackDelaySeconds = Math.min(2 ** (attempt + 1), MAX_RETRY_DELAY_SECONDS);
    const boundedDelaySeconds = Math.min(
      retryAfterSeconds ?? fallbackDelaySeconds,
      MAX_RETRY_DELAY_SECONDS,
    );

    // Add a little jitter so repeated admin bulk jobs do not retry in lockstep.
    const jitterMs = Math.floor(Math.random() * 400);
    await sleep(boundedDelaySeconds * 1000 + jitterMs);
  }

  return {
    ok: false,
    status: 500,
    errorText: "AI gateway request exhausted retries unexpectedly.",
    retryAfterSeconds: null,
  };
}
