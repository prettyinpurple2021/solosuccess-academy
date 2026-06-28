import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PurchaseGuard } from "./PurchaseGuard";

// ── Mocks ─────────────────────────────────────────────────────────────────

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockUseHasPurchasedCourse = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useAuth", () => ({ useAuth: mockUseAuth }));
vi.mock("@/hooks/useCourses", () => ({
  useHasPurchasedCourse: mockUseHasPurchasedCourse,
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

function renderGuard(courseId = "course-abc") {
  const Wrapper = createWrapper();
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={[`/courses/${courseId}/lessons/lesson-1`]}>
        <Routes>
          <Route element={<PurchaseGuard />}>
            <Route
              path="/courses/:courseId/lessons/:lessonId"
              element={<div>Protected lesson content</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </Wrapper>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("PurchaseGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: "user-1" } });
  });

  it("renders children when user has purchased the course", async () => {
    mockUseHasPurchasedCourse.mockReturnValue({
      data: true,
      isLoading: false,
    });

    renderGuard();

    expect(screen.getByText("Protected lesson content")).toBeInTheDocument();
  });

  it("shows access-denied UI when user has NOT purchased", () => {
    mockUseHasPurchasedCourse.mockReturnValue({
      data: false,
      isLoading: false,
    });

    renderGuard();

    expect(screen.getByText("Course Not Purchased")).toBeInTheDocument();
    expect(
      screen.getByText(/You need to purchase this course/i)
    ).toBeInTheDocument();
    // Protected content must NOT be visible
    expect(
      screen.queryByText("Protected lesson content")
    ).not.toBeInTheDocument();
  });

  it("shows a spinner while purchase status is loading", () => {
    mockUseHasPurchasedCourse.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = renderGuard();

    // Protected content must NOT be rendered during loading
    expect(
      screen.queryByText("Protected lesson content")
    ).not.toBeInTheDocument();
    // Container renders something (the spinner)
    expect(container.firstChild).not.toBeNull();
  });

  it("does not render children when user is null", () => {
    mockUseAuth.mockReturnValue({ user: null });
    mockUseHasPurchasedCourse.mockReturnValue({
      data: false,
      isLoading: false,
    });

    renderGuard();

    expect(
      screen.queryByText("Protected lesson content")
    ).not.toBeInTheDocument();
  });
});
