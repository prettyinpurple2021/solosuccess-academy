import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAuth } from "./useAuth";

// Mock Supabase client — hoisted so the factory can reference these fns
const { mockGetSession, mockSignOut, mockOnAuthStateChange } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockSignOut: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  it("initialises with isAuthenticated false when there is no session", async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("sets isAuthenticated true when getSession returns a valid session", async () => {
    const fakeUser = { id: "user-123", email: "test@example.com" };
    mockGetSession.mockResolvedValue({
      data: { session: { user: fakeUser, access_token: "token-abc" } },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(result.current.user?.id).toBe("user-123");
  });

  it("updates isAuthenticated when auth state changes via onAuthStateChange", async () => {
    const fakeUser = { id: "user-456", email: "other@example.com" };
    const fakeSession = { user: fakeUser, access_token: "tok-xyz" };

    // Both sources (onAuthStateChange callback and getSession) must agree on the
    // session so neither overwrites the other with a conflicting null state.
    mockGetSession.mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    });
    mockOnAuthStateChange.mockImplementation((callback: (event: string, session: unknown) => void) => {
      callback("SIGNED_IN", fakeSession);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(result.current.user?.email).toBe("other@example.com");
  });
});
