import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("renders copyright text with current year", () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`© ${currentYear} Sam Kirk`, "i"))
    ).toBeInTheDocument();
  });

  it("renders contact email link", () => {
    render(<Footer />);

    // Footer should contain the email link
    const footer = document.querySelector("footer");
    expect(footer).toBeInTheDocument();

    // Find email link within the footer
    const emailLinks = screen.getAllByRole("link", { name: /sam@samkirk\.com/i });
    // There should be at least one email link
    expect(emailLinks.length).toBeGreaterThanOrEqual(1);
    expect(emailLinks[0]).toHaveAttribute("href", "mailto:sam@samkirk.com");
  });
});
