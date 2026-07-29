import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PocketFlowPage from "./page";

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


describe("Pocket Flow page", () => {
  it("renders the page heading", () => {
    render(<PocketFlowPage />);

    expect(
      screen.getByRole("heading", { name: /pocket flow/i })
    ).toBeInTheDocument();
  });

  it("renders the page description", () => {
    render(<PocketFlowPage />);

    expect(
      screen.getByText(/lightweight framework for building ai workflows/i)
    ).toBeInTheDocument();
  });

  it("renders the write-up inline rather than in an iframe", () => {
    const { container } = render(<PocketFlowPage />);

    // The content is server-rendered into the page for SEO — no iframe.
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByLabelText(/content/i)).toHaveAttribute(
      "data-src",
      "pocket-flow.html"
    );
  });
});
