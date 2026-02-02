import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DanceInstructionPage from "./page";

describe("Dance Instruction page", () => {
  it("renders the page heading", () => {
    render(<DanceInstructionPage />);

    expect(
      screen.getByRole("heading", { name: /dance instruction/i })
    ).toBeInTheDocument();
  });

  it("renders the page description", () => {
    render(<DanceInstructionPage />);

    expect(
      screen.getByText(/thoughts and resources on teaching and learning dance/i)
    ).toBeInTheDocument();
  });

  it("renders the static HTML viewer iframe", () => {
    render(<DanceInstructionPage />);

    const iframe = screen.getByTitle("Dance Instruction content");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", "/static/dance-instruction.html");
  });
});
