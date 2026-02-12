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

  it("renders all three AI tool cards with correct headings and links", () => {
    render(<Home />);

    // Verify tool card headings are rendered
    expect(
      screen.getByRole("heading", { name: /how do i fit\?/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /custom resume/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /interview me/i })
    ).toBeInTheDocument();

    // Verify CTA links point to correct tool routes
    const fitLinks = screen.getAllByRole("link", { name: /analyze fit/i });
    expect(fitLinks.length).toBeGreaterThanOrEqual(1);
    expect(fitLinks[0]).toHaveAttribute("href", "/hire-me/fit");

    const resumeLinks = screen.getAllByRole("link", { name: /generate resume/i });
    expect(resumeLinks.length).toBeGreaterThanOrEqual(1);
    expect(resumeLinks[0]).toHaveAttribute("href", "/hire-me/resume");

    const interviewLinks = screen.getAllByRole("link", { name: /start interview/i });
    expect(interviewLinks.length).toBeGreaterThanOrEqual(1);
    expect(interviewLinks[0]).toHaveAttribute("href", "/hire-me/interview");
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

  it("renders contact email link", () => {
    render(<Home />);

    const emailLinks = screen.getAllByRole("link", { name: /sam@samkirk\.com/i });
    expect(emailLinks.length).toBeGreaterThanOrEqual(1);
    expect(emailLinks[0]).toHaveAttribute("href", "mailto:sam@samkirk.com");
  });
});
