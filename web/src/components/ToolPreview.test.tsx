import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToolPreview } from "./ToolPreview";

describe("ToolPreview", () => {
  const defaultProps = {
    title: "Fit Analysis",
    description: "Get a detailed fit analysis with scoring.",
    ctaText: "Try it now",
    ctaLink: "/tools/fit",
  };

  it("renders title and description", () => {
    render(<ToolPreview {...defaultProps} />);

    expect(
      screen.getByRole("heading", { name: /fit analysis/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Get a detailed fit analysis with scoring.")
    ).toBeInTheDocument();
  });

  it("renders CTA link with correct href and text", () => {
    render(<ToolPreview {...defaultProps} />);

    const ctaLink = screen.getByRole("link", { name: /try it now/i });
    expect(ctaLink).toBeInTheDocument();
    expect(ctaLink).toHaveAttribute("href", "/tools/fit");
  });

  it("renders icon when provided", () => {
    render(
      <ToolPreview
        {...defaultProps}
        icon={<svg data-testid="test-icon" />}
      />
    );

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("does not render icon container when icon is not provided", () => {
    const { container } = render(<ToolPreview {...defaultProps} />);

    // The icon wrapper has aria-hidden="true"; it should not exist
    expect(container.querySelector("[aria-hidden='true']")).toBeNull();
  });

  it("renders previewContent when provided", () => {
    render(
      <ToolPreview
        {...defaultProps}
        previewContent={<p data-testid="preview">Preview here</p>}
      />
    );

    expect(screen.getByTestId("preview")).toBeInTheDocument();
    expect(screen.getByText("Preview here")).toBeInTheDocument();
  });

  it("does not render preview section when previewContent is not provided", () => {
    const { container } = render(<ToolPreview {...defaultProps} />);

    // The preview wrapper uses bg-secondary class; it should not exist
    const previewSection = container.querySelector(".bg-secondary");
    expect(previewSection).toBeNull();
  });

  it("applies card styling classes", () => {
    const { container } = render(<ToolPreview {...defaultProps} />);

    const card = container.firstElementChild as HTMLElement;
    expect(card).toHaveClass("rounded-xl");
    expect(card).toHaveClass("border");
    expect(card).toHaveClass("shadow-sm");
  });
});
