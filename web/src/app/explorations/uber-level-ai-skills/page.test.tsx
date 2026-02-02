import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import UberLevelAiSkillsPage from "./page";

describe("Uber Level AI Skills page", () => {
  it("renders the page heading", () => {
    render(<UberLevelAiSkillsPage />);

    expect(
      screen.getByRole("heading", { name: /uber level ai skills/i })
    ).toBeInTheDocument();
  });

  it("renders the page description", () => {
    render(<UberLevelAiSkillsPage />);

    expect(
      screen.getByText(/advanced techniques for getting the most out of ai tools/i)
    ).toBeInTheDocument();
  });

  it("renders the static HTML viewer iframe", () => {
    render(<UberLevelAiSkillsPage />);

    const iframe = screen.getByTitle("Uber Level AI Skills content");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", "/static/uber-level-ai-skills.html");
  });
});
