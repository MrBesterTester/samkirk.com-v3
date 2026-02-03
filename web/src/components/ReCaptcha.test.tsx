import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReCaptcha, CaptchaGate } from "./ReCaptcha";

// Mock next/script
vi.mock("next/script", () => ({
  default: ({ onLoad }: { onLoad?: () => void }) => {
    // Simulate script loading
    if (onLoad) {
      setTimeout(onLoad, 0);
    }
    return <div data-testid="recaptcha-script" />;
  },
}));

describe("ReCaptcha", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    // Reset grecaptcha on window
    delete (window as unknown as Record<string, unknown>).grecaptcha;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("shows error when site key is not configured", () => {
    // Temporarily remove the env var
    const { NEXT_PUBLIC_RECAPTCHA_SITE_KEY } = process.env;
    delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    render(<ReCaptcha onVerify={vi.fn()} />);

    expect(screen.getByText("reCAPTCHA not configured")).toBeInTheDocument();

    // Restore
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  });

  it("renders container element when site key is provided", () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

    render(<ReCaptcha onVerify={vi.fn()} />);

    expect(screen.getByTestId("recaptcha-container")).toBeInTheDocument();
  });

  it("shows loading placeholder initially", () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

    render(<ReCaptcha onVerify={vi.fn()} />);

    // Should show the loading placeholder
    expect(
      document.querySelector(".animate-pulse")
    ).toBeInTheDocument();
  });

  it("applies custom className", () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

    render(<ReCaptcha onVerify={vi.fn()} className="my-custom-class" />);

    expect(screen.getByTestId("recaptcha-container")).toHaveClass(
      "my-custom-class"
    );
  });
});

describe("CaptchaGate", () => {
  it("shows captcha initially, not children", () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

    render(
      <CaptchaGate>
        <div data-testid="protected-content">Protected Content</div>
      </CaptchaGate>
    );

    // Should show the captcha gate
    expect(
      screen.getByText("Please verify you're human")
    ).toBeInTheDocument();

    // Should not show protected content
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("shows custom title and description", () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

    render(
      <CaptchaGate
        title="Custom Title"
        description="Custom description text"
      >
        <div>Content</div>
      </CaptchaGate>
    );

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText("Custom description text")).toBeInTheDocument();
  });
});
