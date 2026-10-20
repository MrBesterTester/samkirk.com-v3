import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DownloadLink } from "./TrackedLink";

vi.mock("@/lib/analytics", () => ({
  trackArtifactDownload: vi.fn(),
  trackContactClick: vi.fn(),
  trackCtaClick: vi.fn(),
}));

describe("DownloadLink", () => {
  // Vercel's bot protection can answer a request with its "Security Checkpoint"
  // page. A direct download (the `download` attribute) cannot run that challenge,
  // so the browser saves the checkpoint page under the file's name (seen in
  // Safari, Oct 20, 2026). Opening the file as a page passes the challenge.
  it("opens the artifact in a new tab instead of downloading it directly", () => {
    render(
      <DownloadLink href="/static/example.html" artifactId="example">
        Open
      </DownloadLink>
    );

    const link = screen.getByRole("link", { name: "Open" });
    expect(link).toHaveAttribute("href", "/static/example.html");
    expect(link).not.toHaveAttribute("download");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
