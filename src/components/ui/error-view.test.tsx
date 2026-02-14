import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ErrorView } from "./error-view";

function renderErrorView(props: Parameters<typeof ErrorView>[0] = {}) {
  return render(
    <MemoryRouter>
      <ErrorView {...props} />
    </MemoryRouter>
  );
}

describe("ErrorView", () => {
  it("renders default title and message", () => {
    renderErrorView();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText(/We couldn't load this content/i)
    ).toBeInTheDocument();
  });

  it("renders custom title and message", () => {
    renderErrorView({
      title: "Course load failed",
      message: "Network error.",
    });
    expect(screen.getByText("Course load failed")).toBeInTheDocument();
    expect(screen.getByText("Network error.")).toBeInTheDocument();
  });

  it("shows Try again button when onRetry is provided", async () => {
    const onRetry = vi.fn();
    renderErrorView({ onRetry });
    const button = screen.getByRole("button", { name: /try again/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not show Try again button when onRetry is not provided", () => {
    renderErrorView();
    expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
  });

  it("renders Go home link with default backTo", () => {
    renderErrorView();
    const link = screen.getByRole("link", { name: /go home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders custom back link and label", () => {
    renderErrorView({ backTo: "/courses", backLabel: "Back to courses" });
    const link = screen.getByRole("link", { name: /back to courses/i });
    expect(link).toHaveAttribute("href", "/courses");
  });
});
