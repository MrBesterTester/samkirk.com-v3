import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home page", () => {
  it("renders the welcome heading", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /sam kirk/i })
    ).toBeInTheDocument();
  });

  it("renders the hiring manager section", () => {
    render(<Home />);

    // Use getAllBy since there might be multiple matches and check at least one exists
    const headings = screen.getAllByRole("heading", { name: /hiring manager/i });
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("renders hire-me CTA link", () => {
    render(<Home />);

    const ctaLink = screen.getByRole("link", { name: /interview me now/i });
    expect(ctaLink).toHaveAttribute("href", "/hire-me");
  });

  it("renders TOC sections with links to each page", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /dance menu/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /view this week/i })
    ).toHaveAttribute("href", "/dance-menu");

    expect(
      screen.getByRole("heading", { name: /photo fun/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /try photo fun/i })
    ).toHaveAttribute("href", "https://photo-fun.samkirk.com");

    expect(
      screen.getByRole("heading", { name: /song dedication/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /listen and read/i })
    ).toHaveAttribute("href", "/song-dedication");

    expect(
      screen.getByRole("heading", { name: /explorations/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /browse explorations/i })
    ).toHaveAttribute("href", "/explorations");
  });

  it("renders the Villa Madu Bali section", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /villa madu bali/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /visit villamadubali\.com/i })
    ).toHaveAttribute("href", "https://www.villamadubali.com");
  });
});
