/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("next/image", () => ({
  default: ({
    priority,
    fetchPriority,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & {
    priority?: boolean;
    fetchPriority?: string;
  }) => {
    void priority;
    void fetchPriority;

    return <img {...props} />;
  },
}));

describe("Home page", () => {
  it("renders the starter heading", () => {
    render(<Home />);

    expect(
      screen.getByText("To get started, edit the page.tsx file.")
    ).toBeInTheDocument();
  });
});
