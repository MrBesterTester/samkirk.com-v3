import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AdminDanceMenuPage from "./page";

/**
 * The upload renames every file to a standard name by extension, so the stored
 * `sams-dance-menu.txt` is whatever `.txt` was in the bundle. These tests cover
 * the one thing that makes a wrong file visible while it can still be swapped:
 * a content preview shown before publishing.
 */

function selectFiles(container: HTMLElement, files: File[]) {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("file input not found");
  fireEvent.change(input, { target: { files } });
}

describe("Admin dance-menu upload", () => {
  it("previews the content of each selected file, not just its name", async () => {
    const { container } = render(<AdminDanceMenuPage />);

    selectFiles(container, [
      new File(["Sam's Dance Menu — Week of September 1\n\nZydeco at Ashkenaz"], "sams-dance-menu.txt", {
        type: "text/plain",
      }),
      new File(
        ["<!DOCTYPE html>\n<html><head><title>Sam's Dance Menu — Week of September 1</title></head><body></body></html>"],
        "menu.html",
        { type: "text/html" },
      ),
    ]);

    // Both files land under the same standard name downstream, so the preview
    // is the only thing distinguishing them at upload time.
    await waitFor(() => {
      expect(
        screen.getAllByText(/Sam's Dance Menu — Week of September 1/),
      ).toHaveLength(2);
    });
  });

  it("shows the notes preview when the wrong .txt is picked", async () => {
    const { container } = render(<AdminDanceMenuPage />);

    selectFiles(container, [
      new File(["Notes to self: call the venue about parking."], "notes.txt", {
        type: "text/plain",
      }),
    ]);

    // This is the bug this feature exists to catch: a notes file selected as
    // the menu. The filename alone would not have given it away.
    await waitFor(() => {
      expect(
        screen.getByText(/Notes to self: call the venue about parking\./),
      ).toBeInTheDocument();
    });
  });

  it("says so plainly when a file cannot be previewed", async () => {
    const { container } = render(<AdminDanceMenuPage />);

    selectFiles(container, [
      new File(["%PDF-1.7 binary"], "menu.pdf", { type: "application/pdf" }),
    ]);

    await waitFor(() => {
      expect(screen.getByText("No preview available")).toBeInTheDocument();
    });
  });
});
