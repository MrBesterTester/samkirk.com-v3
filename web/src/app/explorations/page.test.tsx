import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ExplorationsPage from "./page";

describe("Explorations hub page", () => {
  it("renders the main heading", () => {
    render(<ExplorationsPage />);

    expect(
      screen.getByRole("heading", { name: /explorations/i })
    ).toBeInTheDocument();
  });

  it("renders links to all exploration topics", () => {
    render(<ExplorationsPage />);

    const categoryTheoryLink = screen.getByRole("link", {
      name: /category theory/i,
    });
    expect(categoryTheoryLink).toHaveAttribute(
      "href",
      "/explorations/category-theory"
    );

    const pocketFlowLink = screen.getByRole("link", { name: /pocket flow/i });
    expect(pocketFlowLink).toHaveAttribute("href", "https://mrbestertester.github.io/pf-understand/");

    const danceInstructionLink = screen.getByRole("link", {
      name: /dance instruction/i,
    });
    expect(danceInstructionLink).toHaveAttribute(
      "href",
      "/explorations/dance-instruction"
    );

    const aiSkillsLink = screen.getByRole("link", {
      name: /uber level ai skills/i,
    });
    expect(aiSkillsLink).toHaveAttribute(
      "href",
      "/explorations/uber-level-ai-skills"
    );

    const tensorLogicLink = screen.getByRole("link", {
      name: /tensor logic/i,
    });
    expect(tensorLogicLink).toHaveAttribute(
      "href",
      "/explorations/tensor-logic"
    );
  });

  it("renders descriptions for each exploration topic", () => {
    render(<ExplorationsPage />);

    expect(
      screen.getByText(/examples of category theory using common, everyday/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/tutorials using pocket flow for understanding/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/thoughts and resources on teaching and learning dance/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/advanced techniques for getting the most out of ai tools/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/educational interactive demo illustrating/i)
    ).toBeInTheDocument();
  });
});
