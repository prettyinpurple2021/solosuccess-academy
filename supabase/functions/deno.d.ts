/**
 * Minimal type declarations for Supabase Edge Functions (Deno runtime).
 * For full IntelliSense, install the "Deno" extension and enable it for this folder.
 */

/* ── Deno namespace ── */
declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }
  function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

/* ── Web-standard globals used by Edge Functions ── */
declare const console: {
  log(...data: unknown[]): void;
  error(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  info(...data: unknown[]): void;
};

declare function fetch(input: string | Request, init?: RequestInit): Promise<Response>;
declare function setTimeout(cb: (...args: unknown[]) => void, ms?: number): number;
declare function clearTimeout(id: number): void;

interface RequestInit {
  method?: string;
  headers?: Record<string, string> | Headers;
  body?: string | FormData | Blob | ArrayBuffer | ReadableStream | null;
  signal?: AbortSignal;
}

interface HeadersInit {
  [key: string]: string;
}

declare class Headers {
  constructor(init?: Record<string, string>);
  get(name: string): string | null;
  set(name: string, value: string): void;
  has(name: string): boolean;
  delete(name: string): void;
  forEach(cb: (value: string, key: string) => void): void;
}

declare class Request {
  constructor(input: string | Request, init?: RequestInit);
  readonly method: string;
  readonly url: string;
  readonly headers: Headers;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

declare class Response {
  constructor(body?: string | Blob | ArrayBuffer | ReadableStream | null, init?: ResponseInit);
  readonly ok: boolean;
  readonly status: number;
  readonly headers: Headers;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

interface ResponseInit {
  status?: number;
  statusText?: string;
  headers?: Record<string, string> | Headers;
}

declare class URL {
  constructor(url: string, base?: string);
  readonly searchParams: URLSearchParams;
  readonly pathname: string;
  readonly hostname: string;
  toString(): string;
}

declare class URLSearchParams {
  get(name: string): string | null;
  has(name: string): boolean;
}

declare module "https://deno.land/std@0.190.0/http/server.ts" {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
    options?: { port?: number }
  ): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.49.1" {
  export function createClient(url: string, key: string): {
    auth: { getUser(token: string): Promise<unknown>; admin: { getUserById(id: string): Promise<unknown> } };
    from(table: string): { select(cols: string): unknown; insert(row: unknown): Promise<{ error?: unknown }> };
  };
}

declare module "https://deno.land/x/smtp@v0.7.0/mod.ts" {
  export class SmtpClient {
    connectTLS(options: unknown): Promise<void>;
    send(options: unknown): Promise<void>;
    close(): Promise<void>;
  }
}
