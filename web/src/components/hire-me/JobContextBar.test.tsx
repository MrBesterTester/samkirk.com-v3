import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { JobContextBar } from "./JobContextBar";

const STORAGE_KEY = "hire-me-job-context";

function renderBar(overrides: Partial<React.ComponentProps<typeof JobContextBar>> = {}) {
  return render(
    <JobContextBar
      onJobLoaded={vi.fn()}
      onJobCleared={vi.fn()}
      {...overrides}
    />,
  );
}

describe("JobContextBar", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("opens the paste input immediately when no job is stored", () => {
    renderBar();

    // The primary action must be usable without a preliminary click. A
    // collapsed bar puts an "Add Job" button between arrival and the input.
    expect(
      screen.getByPlaceholderText("Paste the full job posting text here..."),
    ).toBeInTheDocument();
  });

  it("stays collapsed when a job is already loaded", () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ mode: "paste", text: "A stored job posting." }),
    );

    renderBar({ jobTitle: "Staff Engineer", jobCompany: "Acme" });

    // Once a job is loaded the summary is the useful view, not the editor.
    expect(screen.getByText("Staff Engineer at Acme")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Paste the full job posting text here..."),
    ).not.toBeInTheDocument();
  });
});
