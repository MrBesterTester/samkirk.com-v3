import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Header } from "./Header";

describe("Header", () => {
  it("renders the site name/logo link", () => {
    render(<Header />);

    const logoLink = screen.getByRole("link", { name: /sam kirk/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("renders all main navigation links (desktop + mobile)", () => {
    render(<Header />);

    // Each nav link appears twice (desktop + mobile menu), so use getAllBy
    const homeLinks = screen.getAllByRole("link", { name: /^home$/i });
    expect(homeLinks.length).toBeGreaterThanOrEqual(1);

    const toolsLinks = screen.getAllByRole("link", { name: /^tools$/i });
    expect(toolsLinks.length).toBeGreaterThanOrEqual(1);

    const danceMenuLinks = screen.getAllByRole("link", {
      name: /^dance menu$/i,
    });
    expect(danceMenuLinks.length).toBeGreaterThanOrEqual(1);

    const songLinks = screen.getAllByRole("link", {
      name: /^song dedication$/i,
    });
    expect(songLinks.length).toBeGreaterThanOrEqual(1);

    const explorationsLinks = screen.getAllByRole("link", {
      name: /^explorations$/i,
    });
    expect(explorationsLinks.length).toBeGreaterThanOrEqual(1);

    const adminLinks = screen.getAllByRole("link", { name: /^admin$/i });
    expect(adminLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the mobile menu button", () => {
    render(<Header />);

    // Use getAllBy since there might be multiple buttons due to test environment
    const menuButtons = screen.getAllByRole("button", { name: /open menu/i });
    expect(menuButtons.length).toBeGreaterThanOrEqual(1);
    expect(menuButtons[0]).toBeInTheDocument();
  });

  it("toggles mobile menu on button click", async () => {
    const user = userEvent.setup();
    render(<Header />);

    // Get the first menu button
    const menuButtons = screen.getAllByRole("button", { name: /open menu/i });
    const menuButton = menuButtons[0];

    // Initially, mobile menu is closed
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    // Open menu
    await user.click(menuButton);

    // After opening, the button label changes to "Close menu"
    const closeButtons = screen.getAllByRole("button", { name: /close menu/i });
    expect(closeButtons[0]).toHaveAttribute("aria-expanded", "true");

    // Close menu
    await user.click(closeButtons[0]);

    // After closing, the button label changes back to "Open menu"
    const reopenButtons = screen.getAllByRole("button", { name: /open menu/i });
    expect(reopenButtons[0]).toHaveAttribute("aria-expanded", "false");
  });

  it("has correct href attributes for main nav links", () => {
    render(<Header />);

    // Check that at least one link with each href exists
    const homeLinks = screen.getAllByRole("link", { name: /^home$/i });
    expect(homeLinks[0]).toHaveAttribute("href", "/");

    const toolsLinks = screen.getAllByRole("link", { name: /^tools$/i });
    expect(toolsLinks[0]).toHaveAttribute("href", "/tools");

    const danceMenuLinks = screen.getAllByRole("link", {
      name: /^dance menu$/i,
    });
    expect(danceMenuLinks[0]).toHaveAttribute("href", "/dance-menu");

    const songLinks = screen.getAllByRole("link", {
      name: /^song dedication$/i,
    });
    expect(songLinks[0]).toHaveAttribute("href", "/song-dedication");

    const explorationsLinks = screen.getAllByRole("link", {
      name: /^explorations$/i,
    });
    expect(explorationsLinks[0]).toHaveAttribute("href", "/explorations");

    const adminLinks = screen.getAllByRole("link", { name: /^admin$/i });
    expect(adminLinks[0]).toHaveAttribute("href", "/admin");
  });

  it("renders the desktop navigation", () => {
    render(<Header />);

    // Find the desktop nav (the <ul> element with md:flex)
    const desktopNav = document.querySelector("ul.md\\:flex");
    expect(desktopNav).toBeInTheDocument();
  });
});
