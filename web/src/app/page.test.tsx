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
    expect(fitLinks[0]).toHaveAttribute("href", "/tools/fit");

    const resumeLinks = screen.getAllByRole("link", { name: /generate resume/i });
    expect(resumeLinks.length).toBeGreaterThanOrEqual(1);
    expect(resumeLinks[0]).toHaveAttribute("href", "/tools/resume");

    const interviewLinks = screen.getAllByRole("link", { name: /start interview/i });
    expect(interviewLinks.length).toBeGreaterThanOrEqual(1);
    expect(interviewLinks[0]).toHaveAttribute("href", "/tools/interview");
  });

  it("renders the explore section with navigation links", () => {
    render(<Home />);

    const explorationsLinks = screen.getAllByRole("link", { name: /explorations/i });
    expect(explorationsLinks.length).toBeGreaterThanOrEqual(1);

    const danceMenuLinks = screen.getAllByRole("link", { name: /dance menu/i });
    expect(danceMenuLinks.length).toBeGreaterThanOrEqual(1);

    const songLinks = screen.getAllByRole("link", { name: /song dedication/i });
    expect(songLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("renders contact email link", () => {
    render(<Home />);

    const emailLinks = screen.getAllByRole("link", { name: /sam@samkirk\.com/i });
    expect(emailLinks.length).toBeGreaterThanOrEqual(1);
    expect(emailLinks[0]).toHaveAttribute("href", "mailto:sam@samkirk.com");
  });
});
