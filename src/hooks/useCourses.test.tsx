import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCourses } from "./useCourses";

const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  })),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useCourses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const chain = {
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: "course-1",
            title: "Test Course",
            order_number: 1,
            phase: "initialization",
            is_published: true,
          },
        ],
        error: null,
      }),
    };
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(chain),
      }),
    });
  });

  it("fetches and returns published courses", async () => {
    const { result } = renderHook(() => useCourses(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].title).toBe("Test Course");
    expect(result.current.data?.[0].id).toBe("course-1");
    expect(mockSupabase.from).toHaveBeenCalledWith("courses");
  });

  it("returns loading state initially", () => {
    const { result } = renderHook(() => useCourses(), {
      wrapper: createWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
  });
});
