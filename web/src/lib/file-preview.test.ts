import { describe, expect, it } from "vitest";

import { previewOf } from "./file-preview";

describe("previewOf", () => {
  it("returns the first meaningful line of a plain-text file", () => {
    expect(previewOf("Sam's Dance Menu — Week of Sept 1\nZydeco at Ashkenaz…", ".txt")).toBe(
      "Sam's Dance Menu — Week of Sept 1",
    );
  });

  it("skips leading blank lines", () => {
    expect(previewOf("\n\n   \nActual first line", ".txt")).toBe("Actual first line");
  });

  it("collapses runs of whitespace inside the line", () => {
    expect(previewOf("Dance    Menu\t\tWeek 36", ".txt")).toBe("Dance Menu Week 36");
  });

  it("truncates a long line and marks it with an ellipsis", () => {
    const long = "x".repeat(200);
    const out = previewOf(long, ".txt", 40);
    expect(out).toHaveLength(41); // 40 chars + the ellipsis
    expect(out.endsWith("…")).toBe(true);
  });

  it("prefers the <title> for an HTML file", () => {
    const html = "<!DOCTYPE html>\n<html><head><title>Sam's Dance Menu</title></head><body><p>Hi</p></body></html>";
    // Without this the preview would read "<!DOCTYPE html>", which tells the
    // operator nothing about which document they are about to publish.
    expect(previewOf(html, ".html")).toBe("Sam's Dance Menu");
  });

  it("falls back to stripped body text when HTML has no title", () => {
    const html = "<!DOCTYPE html>\n<html><body><h1>Weekly Zydeco Listings</h1></body></html>";
    expect(previewOf(html, ".html")).toBe("Weekly Zydeco Listings");
  });

  it("returns an empty string for empty or whitespace-only content", () => {
    expect(previewOf("", ".txt")).toBe("");
    expect(previewOf("   \n\t\n", ".txt")).toBe("");
  });

  it("returns an empty string for a binary format it cannot read", () => {
    expect(previewOf("%PDF-1.7 ...binary...", ".pdf")).toBe("");
  });
});
