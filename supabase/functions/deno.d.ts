/**
 * Type declarations for Supabase Edge Functions (Deno runtime).
 *
 * The TypeScript checker pulls Deno + DOM lib definitions from the `lib`
 * field in `supabase/functions/deno.json`. Those libs already provide
 * `Deno`, `console`, `fetch`, `Request`, `Response`, `Headers`, `URL`, etc.
 *
 * This file intentionally stays empty so we don't shadow or duplicate
 * built-in declarations. Add ambient module shims here only if a remote
 * import truly cannot be type-resolved by the runtime (very rare).
 */
export {};
