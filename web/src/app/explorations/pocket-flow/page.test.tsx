import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PocketFlowPage from "./page";

describe("Pocket Flow page", () => {
  it("renders the page heading", () => {
    render(<PocketFlowPage />);

    expect(
      screen.getByRole("heading", { name: /pocket flow/i })
    ).toBeInTheDocument();
  });

  it("renders the page description", () => {
    render(<PocketFlowPage />);

    expect(
      screen.getByText(/lightweight framework for building ai workflows/i)
    ).toBeInTheDocument();
  });

  it("renders the static HTML viewer iframe", () => {
    render(<PocketFlowPage />);

    const iframe = screen.getByTitle("Pocket Flow content");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", "/static/pocket-flow.html");
  });
});
