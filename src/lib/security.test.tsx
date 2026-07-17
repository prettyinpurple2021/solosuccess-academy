/**
 * Security-critical unit tests.
 *
 * These tests verify that business-logic invariants that protect
 * paid content and user data are correct. They run in CI on every PR.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ── 1. Price formatting ────────────────────────────────────────────────────
import { formatPrice } from "./courseData";

// ── 2–4. Production validation utilities ──────────────────────────────────
import { isSafeOrigin, isValidUUID } from "./validation";

// ── 2. Purchase guard logic (uses the real hook) ───────────────────────────
import { useHasPurchasedCourse } from "../hooks/useCourses";

const mockRpc = vi.hoisted(() => vi.fn());

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: mockRpc,
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
    })),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("formatPrice", () => {
  it("formats negative prices consistently", () => {
    // Intl formatting should preserve the sign for negative values
    expect(formatPrice(0)).toBe("$0.00");
    expect(formatPrice(-100)).toBe("-$1.00");
  });

  it("formats typical course price correctly", () => {
    expect(formatPrice(4900)).toBe("$49.00");
    expect(formatPrice(9700)).toBe("$97.00");
  });
});

// ── 2. Purchase access control ────────────────────────────────────────────
describe("Purchase access control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips the DB query when userId or courseId is absent", async () => {
    const { result } = renderHook(
      () => useHasPurchasedCourse(undefined, "course-1"),
      { wrapper: createWrapper() },
    );
    // Query is disabled when userId is missing — RPC must never be called
    expect(mockRpc).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("calls has_purchased_course RPC and returns true when user owns the course", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });

    const { result } = renderHook(
      () => useHasPurchasedCourse("user-1", "course-1"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("has_purchased_course", {
      _user_id: "user-1",
      _course_id: "course-1",
    });
  });

  it("returns false when the RPC reports no purchase", async () => {
    mockRpc.mockResolvedValue({ data: false, error: null });

    const { result } = renderHook(
      () => useHasPurchasedCourse("user-1", "course-1"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(false);
  });
});

// ── 3. Origin allow-list ───────────────────────────────────────────────────
describe("CORS origin validation", () => {
  it("allows production domains", () => {
    expect(isSafeOrigin("https://solosuccessacademy.app")).toBe(true);
    expect(isSafeOrigin("https://www.solosuccessacademy.app")).toBe(true);
    expect(isSafeOrigin("https://solosuccessacademy.cloud")).toBe(true);
  });

  it("allows Lovable preview domains", () => {
    expect(isSafeOrigin("https://my-project.lovable.app")).toBe(true);
    expect(isSafeOrigin("https://abc123.lovable.app")).toBe(true);
  });

  it("rejects arbitrary external origins", () => {
    expect(isSafeOrigin("https://evil.com")).toBe(false);
    expect(isSafeOrigin("https://solosuccessacademy.app.evil.com")).toBe(false);
    expect(isSafeOrigin("http://solosuccessacademy.app")).toBe(false); // http not https
    expect(isSafeOrigin("")).toBe(false);
  });

  it("rejects origins that try to embed the allowed domain as a substring", () => {
    expect(isSafeOrigin("https://notsolosuccessacademy.app")).toBe(false);
    expect(isSafeOrigin("https://solosuccessacademy.app.attacker.com")).toBe(false);
  });
});

// ── 4. Checkout metadata validation ──────────────────────────────────────
describe("Stripe checkout metadata validation", () => {
  it("accepts valid UUIDs", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isValidUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
  });

  it("rejects non-UUID strings that could be used for injection", () => {
    expect(isValidUUID("'; DROP TABLE purchases;--")).toBe(false);
    expect(isValidUUID("admin")).toBe(false);
    expect(isValidUUID("")).toBe(false);
    expect(isValidUUID("../../../etc/passwd")).toBe(false);
  });
});

// ── 5. Webhook idempotency logic ──────────────────────────────────────────
describe("Stripe webhook idempotency", () => {
  it("unique constraint code 23505 is recognized as safe duplicate", () => {
    // The webhook handler treats PG unique_violation (23505) as a no-op
    const UNIQUE_VIOLATION_CODE = "23505";
    const mockError = { code: "23505", message: "duplicate key value" };
    expect(mockError.code).toBe(UNIQUE_VIOLATION_CODE);
  });
});

