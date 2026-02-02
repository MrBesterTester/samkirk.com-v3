import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CategoryTheoryPage from "./page";

describe("Category Theory page", () => {
  it("renders the page heading", () => {
    render(<CategoryTheoryPage />);

    expect(
      screen.getByRole("heading", { name: /category theory/i })
    ).toBeInTheDocument();
  });

  it("renders the page description", () => {
    render(<CategoryTheoryPage />);

    expect(
      screen.getByText(/mathematical foundations of abstraction/i)
    ).toBeInTheDocument();
  });

  it("renders the static HTML viewer iframe", () => {
    render(<CategoryTheoryPage />);

    const iframe = screen.getByTitle("Category Theory content");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", "/static/category-theory.html");
  });
});
