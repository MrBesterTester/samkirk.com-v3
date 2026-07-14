import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MachineLearningPage from "./page";

describe("Machine Learning page", () => {
  it("renders the page heading", () => {
    render(<MachineLearningPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /machine learning/i })
    ).toBeInTheDocument();
  });

  it("links to the physics-first-zoo repo", () => {
    render(<MachineLearningPage />);

    const links = screen
      .getAllByRole("link")
      .filter((a) =>
        a.getAttribute("href")?.includes("github.com/MrBesterTester/physics-first-zoo")
      );
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("gives Computer Diagnostics a home here", () => {
    render(<MachineLearningPage />);

    expect(
      screen.getByRole("link", { name: /computer diagnostics via lora fine-tuning/i })
    ).toHaveAttribute("href", "/computer-diagnostics");
  });

  it("states that the acceptance criteria were pre-registered", () => {
    render(<MachineLearningPage />);

    expect(screen.getByText(/pre-registered/i)).toBeInTheDocument();
  });

  it("labels SmolVLA honestly as inference-only, not trained here", () => {
    render(<MachineLearningPage />);

    expect(screen.getByText(/not trained here/i)).toBeInTheDocument();
  });

  it("opens external repo links safely in a new tab", () => {
    render(<MachineLearningPage />);

    screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href")?.startsWith("http"))
      .forEach((a) => {
        expect(a).toHaveAttribute("target", "_blank");
        expect(a).toHaveAttribute("rel", "noopener noreferrer");
      });
  });
});
