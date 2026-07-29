import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DanceInstructionPage from "./page";

// StaticHtmlContent is an async server component that reads from the filesystem;
// React Testing Library cannot render one synchronously. Its real behaviour —
// body extraction and CSS scoping — is covered by src/lib/static-html.test.ts.
vi.mock("@/components", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components")>();
  return {
    ...actual,
    StaticHtmlContent: ({ title, src }: { title: string; src: string }) => (
      <section aria-label={title} data-src={src} />
    ),
  };
});


describe("Dance Instruction page", () => {
  it("renders the page heading", () => {
    render(<DanceInstructionPage />);

    expect(
      screen.getByRole("heading", { name: /dance instruction/i })
    ).toBeInTheDocument();
  });

  it("renders the page description", () => {
    render(<DanceInstructionPage />);

    expect(
      screen.getByText(/thoughts and resources on teaching and learning dance/i)
    ).toBeInTheDocument();
  });

  it("renders the write-up inline rather than in an iframe", () => {
    const { container } = render(<DanceInstructionPage />);

    // The content is server-rendered into the page for SEO — no iframe.
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByLabelText(/content/i)).toHaveAttribute(
      "data-src",
      "dance-instruction.html"
    );
  });
});
