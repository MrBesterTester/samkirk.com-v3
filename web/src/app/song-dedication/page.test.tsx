import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SongDedicationPage from "./page";

describe("Song Dedication page", () => {
  it("renders the main heading", () => {
    render(<SongDedicationPage />);

    expect(
      screen.getByRole("heading", { name: /resilience in the storm/i })
    ).toBeInTheDocument();
  });

  it("renders the about section", () => {
    render(<SongDedicationPage />);

    expect(
      screen.getByText(/a song created for my mother/i)
    ).toBeInTheDocument();
  });

  it("renders the audio/listen section", () => {
    render(<SongDedicationPage />);

    expect(
      screen.getByRole("heading", { name: /listen/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/your browser does not support the audio element/i)
    ).toBeInTheDocument();
  });

  it("renders external listening links", () => {
    render(<SongDedicationPage />);

    expect(
      screen.getByRole("link", { name: /view chatgpt thread/i })
    ).toBeInTheDocument();
  });

  it("renders the lyrics section with verse and chorus", () => {
    render(<SongDedicationPage />);

    expect(
      screen.getByRole("heading", { name: /lyrics/i })
    ).toBeInTheDocument();

    // Check for verse and chorus labels (exact match to avoid matching lyrics content)
    expect(screen.getByText("Verse 1")).toBeInTheDocument();
    expect(screen.getAllByText("Chorus").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Verse 2")).toBeInTheDocument();
  });

  it("renders song info footer", () => {
    render(<SongDedicationPage />);

    expect(screen.getByText("ChatGPT")).toBeInTheDocument();
    expect(screen.getByText("Udio.com")).toBeInTheDocument();
  });
});
