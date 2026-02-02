import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SongDedicationPage from "./page";

describe("Song Dedication page", () => {
  it("renders the main heading", () => {
    render(<SongDedicationPage />);

    expect(
      screen.getByRole("heading", { name: /song dedication/i })
    ).toBeInTheDocument();
  });

  it("renders the about section", () => {
    render(<SongDedicationPage />);

    expect(
      screen.getByRole("heading", { name: /about this dedication/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/this song holds a special meaning/i)
    ).toBeInTheDocument();
  });

  it("renders the audio/listen section", () => {
    render(<SongDedicationPage />);

    expect(
      screen.getByRole("heading", { name: /listen/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/audio player will be embedded here/i)
    ).toBeInTheDocument();
  });

  it("renders external listening links", () => {
    render(<SongDedicationPage />);

    expect(screen.getByRole("link", { name: /spotify/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /youtube/i })).toBeInTheDocument();
  });

  it("renders the lyrics section with verse and chorus", () => {
    render(<SongDedicationPage />);

    expect(
      screen.getByRole("heading", { name: /lyrics/i })
    ).toBeInTheDocument();

    // Check for verse and chorus labels (exact match to avoid matching lyrics content)
    expect(screen.getByText("Verse 1")).toBeInTheDocument();
    expect(screen.getByText("Chorus")).toBeInTheDocument();
    expect(screen.getByText("Verse 2")).toBeInTheDocument();
  });

  it("renders song info footer", () => {
    render(<SongDedicationPage />);

    expect(screen.getByText(/song title/i)).toBeInTheDocument();
    expect(screen.getByText(/artist name/i)).toBeInTheDocument();
  });
});
