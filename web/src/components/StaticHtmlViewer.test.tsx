import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StaticHtmlViewer } from "./StaticHtmlViewer";

describe("StaticHtmlViewer", () => {
  it("renders an iframe with correct src path", () => {
    render(<StaticHtmlViewer src="test-content.html" title="Test content" />);

    const iframe = screen.getByTitle("Test content");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", "/static/test-content.html");
  });

  it("applies the sandbox attribute for security", () => {
    render(<StaticHtmlViewer src="test.html" title="Test" />);

    const iframe = screen.getByTitle("Test");
    expect(iframe).toHaveAttribute("sandbox", "allow-same-origin");
  });

  it("uses the provided minHeight", () => {
    render(
      <StaticHtmlViewer src="test.html" title="Test" minHeight={800} />
    );

    const iframe = screen.getByTitle("Test");
    expect(iframe).toHaveStyle({ minHeight: "800px" });
  });

  it("uses default minHeight of 400px when not specified", () => {
    render(<StaticHtmlViewer src="test.html" title="Test" />);

    const iframe = screen.getByTitle("Test");
    expect(iframe).toHaveStyle({ minHeight: "400px" });
  });

  it("renders loading indicator initially", () => {
    render(<StaticHtmlViewer src="test.html" title="Test" />);

    expect(screen.getByText(/loading content/i)).toBeInTheDocument();
  });

  it("wraps iframe in a styled container", () => {
    const { container } = render(
      <StaticHtmlViewer src="test.html" title="Test" />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("rounded-xl", "border", "overflow-hidden");
  });
});
