import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ToolGate } from "./ToolGate";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock next/script for ReCaptcha
vi.mock("next/script", () => ({
  default: ({ onLoad }: { onLoad?: () => void }) => {
    if (onLoad) setTimeout(onLoad, 0);
    return null;
  },
}));

describe("ToolGate", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
  });

  it("shows loading state initially", () => {
    // Never resolve the fetch
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(
      <ToolGate>
        <div data-testid="protected-content">Protected</div>
      </ToolGate>
    );

    expect(screen.getByText("Initializing...")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("shows error state when session init fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(
      <ToolGate>
        <div data-testid="protected-content">Protected</div>
      </ToolGate>
    );

    await waitFor(() => {
      expect(
        screen.getByText("Failed to initialize session")
      ).toBeInTheDocument();
    });

    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("shows captcha gate after successful session init with captchaPassed=false", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessionId: "test-session", isNew: true, captchaPassed: false }),
    });

    render(
      <ToolGate toolName="Test Tool">
        <div data-testid="protected-content">Protected</div>
      </ToolGate>
    );

    await waitFor(() => {
      expect(screen.getByText("Verify to use Test Tool")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("skips captcha and shows children when captchaPassed=true", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessionId: "test-session", isNew: false, captchaPassed: true }),
    });

    render(
      <ToolGate toolName="Test Tool">
        <div data-testid="protected-content">Protected</div>
      </ToolGate>
    );

    await waitFor(() => {
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
  });

  it("shows default title when toolName not provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessionId: "test-session", isNew: true, captchaPassed: false }),
    });

    render(
      <ToolGate>
        <div data-testid="protected-content">Protected</div>
      </ToolGate>
    );

    await waitFor(() => {
      expect(
        screen.getByText("Please verify you're human")
      ).toBeInTheDocument();
    });
  });

  it("shows error when network fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(
      <ToolGate>
        <div data-testid="protected-content">Protected</div>
      </ToolGate>
    );

    await waitFor(() => {
      expect(
        screen.getByText("Failed to connect to server")
      ).toBeInTheDocument();
    });
  });
});
