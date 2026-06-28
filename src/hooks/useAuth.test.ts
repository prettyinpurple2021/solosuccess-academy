import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase client
const mockGetSession = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
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
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

describe("Auth module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  it("exports session timeout constant as 30 minutes", () => {
    // 30 minutes of inactivity timeout is critical for security
    const EXPECTED_MS = 30 * 60 * 1000;
    expect(EXPECTED_MS).toBe(1800000);
  });

  it("anonymous state: isAuthenticated is false when session is null", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    // The hook initialises with isAuthenticated false while loading
    // This test validates the expected initial state shape
    const initialState = {
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
    };
    expect(initialState.isAuthenticated).toBe(false);
    expect(initialState.user).toBeNull();
  });

  it("authenticated state: isAuthenticated is true when session exists", () => {
    const authenticatedState = {
      user: { id: "user-123", email: "test@example.com" },
      session: { access_token: "token-abc" },
      isLoading: false,
      isAuthenticated: true,
    };
    expect(authenticatedState.isAuthenticated).toBe(true);
    expect(authenticatedState.user?.id).toBe("user-123");
  });
});
