import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ChatbotsAndInstrumentsPage, { metadata } from "./page";

describe("Chatbots & Instruments page", () => {
  it("renders the page heading and subtitle", () => {
    render(<ChatbotsAndInstrumentsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /letting your chatbots talk with your instruments/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/my version of anthropic's model hardware standard \(mhs\)/i)
    ).toBeInTheDocument();
  });

  it("opens the four-page brief PDF in a new tab", () => {
    render(<ChatbotsAndInstrumentsPage />);

    // A direct download (the `download` attribute) cannot pass Vercel's bot-protection
    // challenge: Safari saved the "Vercel Security Checkpoint" page as the PDF (Oct 20, 2026).
    // Opening the file as a page lets the challenge run, then Safari shows the PDF.
    const pdf = screen.getByRole("link", { name: /4-page brief/i });
    expect(pdf).toHaveAttribute("href", "/static/tare-technical-brief.pdf");
    expect(pdf).not.toHaveAttribute("download");
    expect(pdf).toHaveAttribute("target", "_blank");
    expect(pdf).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("links the GitHub repository and the LinkedIn post", () => {
    render(<ChatbotsAndInstrumentsPage />);

    expect(screen.getByRole("link", { name: /code and evidence on github/i })).toHaveAttribute(
      "href",
      "https://github.com/MrBesterTester/TARE"
    );
    expect(screen.getByRole("link", { name: /linkedin post/i }).getAttribute("href")).toMatch(
      /^https:\/\/www\.linkedin\.com\/posts\/samuelkirk_letting-your-chatbots/
    );
  });

  it("shows the results table with the 48-trial Opus 5.5 comparison", () => {
    render(<ChatbotsAndInstrumentsPage />);

    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(5);
    expect(within(table).getByText("47 of 48")).toBeInTheDocument();
  });

  it("states independence from Anthropic", () => {
    render(<ChatbotsAndInstrumentsPage />);

    expect(
      screen.getByText(/makes no claim of compatibility with mhs or affiliation with anthropic/i)
    ).toBeInTheDocument();
  });

  it("links every on-page section from the contents strip", () => {
    const { container } = render(<ChatbotsAndInstrumentsPage />);

    const nav = screen.getByRole("navigation", { name: /on this page/i });
    for (const a of within(nav).getAllByRole("link")) {
      const id = a.getAttribute("href")!.slice(1);
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
  });

  it("sets the canonical URL", () => {
    expect(metadata.alternates?.canonical).toMatch(/\/explorations\/chatbots-and-instruments$/);
  });
});
