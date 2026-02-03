"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";

// ============================================================================
// E2E Testing Constants
// ============================================================================

/**
 * Special test token that bypasses reCAPTCHA verification in E2E test mode.
 * Must match the server-side constant in lib/captcha.ts.
 */
const E2E_TEST_CAPTCHA_TOKEN = "__E2E_TEST_CAPTCHA_TOKEN__";

// ============================================================================
// Types
// ============================================================================

export interface ReCaptchaProps {
  /** Callback when captcha is successfully verified */
  onVerify: (token: string) => void;
  /** Callback when captcha expires (user needs to re-verify) */
  onExpire?: () => void;
  /** Callback when captcha encounters an error */
  onError?: () => void;
  /** Optional className for the container div */
  className?: string;
  /** Whether the captcha is disabled */
  disabled?: boolean;
}

export interface ReCaptchaRef {
  /** Reset the captcha widget */
  reset: () => void;
}

// ============================================================================
// Module-level state for script loading
// ============================================================================

let scriptLoaded = false;

// Extend Window interface to include grecaptcha
declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      render: (
        container: HTMLElement,
        params: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark";
          size?: "compact" | "normal";
        }
      ) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * reCAPTCHA v2 checkbox widget component.
 *
 * Uses the site key from NEXT_PUBLIC_RECAPTCHA_SITE_KEY environment variable.
 * When the user completes the captcha, it calls onVerify with the token.
 */
export function ReCaptcha({
  onVerify,
  onExpire,
  onError,
  className,
  disabled = false,
}: ReCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(() => {
    // Check if script is already loaded on initial render
    return scriptLoaded && typeof window !== "undefined" && !!window.grecaptcha;
  });

  // Get site key from environment
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  
  // Derive error state from siteKey rather than using useState
  const error = !siteKey ? "reCAPTCHA site key not configured" : null;

  // Callbacks need to be stable references for grecaptcha
  const handleVerify = useCallback(
    (token: string) => {
      onVerify(token);
    },
    [onVerify]
  );

  const handleExpire = useCallback(() => {
    onExpire?.();
  }, [onExpire]);

  const handleError = useCallback(() => {
    onError?.();
  }, [onError]);

  // Render the captcha widget once grecaptcha is ready
  useEffect(() => {
    if (!siteKey || disabled || !isReady || !containerRef.current) {
      return;
    }

    // Don't re-render if already rendered
    if (widgetIdRef.current !== null) {
      return;
    }

    try {
      widgetIdRef.current = window.grecaptcha!.render(containerRef.current, {
        sitekey: siteKey,
        callback: handleVerify,
        "expired-callback": handleExpire,
        "error-callback": handleError,
        theme: "light",
        size: "normal",
      });
    } catch (renderError) {
      console.error("Failed to render reCAPTCHA:", renderError);
    }
  }, [siteKey, disabled, isReady, handleVerify, handleExpire, handleError]);

  // Handle script load
  const handleScriptLoad = useCallback(() => {
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => {
        scriptLoaded = true;
        setIsReady(true);
      });
    }
  }, []);

  if (!siteKey) {
    return (
      <div
        className={`text-sm text-red-600 dark:text-red-400 ${className || ""}`}
      >
        reCAPTCHA not configured
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`text-sm text-red-600 dark:text-red-400 ${className || ""}`}
      >
        {error}
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://www.google.com/recaptcha/api.js"
        strategy="lazyOnload"
        onLoad={handleScriptLoad}
      />
      <div
        ref={containerRef}
        className={className}
        data-testid="recaptcha-container"
      />
      {!isReady && (
        <div className="h-[78px] w-[304px] animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      )}
    </>
  );
}

// ============================================================================
// Captcha Gate Component
// ============================================================================

export interface CaptchaGateProps {
  /** Content to show once captcha is passed */
  children: React.ReactNode;
  /** Title to show above the captcha */
  title?: string;
  /** Description to show above the captcha */
  description?: string;
  /** Callback when captcha is passed (with the token) */
  onPass?: (token: string) => void;
}

/**
 * Check if E2E testing mode is enabled (client-side).
 */
function isE2ETestingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_E2E_TESTING === "true";
}

/**
 * A gate component that requires captcha verification before showing content.
 * Handles the full flow of: showing captcha → verifying → showing content.
 * 
 * In E2E test mode (NEXT_PUBLIC_E2E_TESTING=true), automatically bypasses
 * the captcha by sending a special test token to the server.
 */
export function CaptchaGate({
  children,
  title = "Please verify you're human",
  description = "Complete the captcha to continue.",
  onPass,
}: CaptchaGateProps) {
  const [status, setStatus] = useState<
    "pending" | "verifying" | "passed" | "error"
  >("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // E2E test mode: automatically verify with test token on mount
  useEffect(() => {
    if (!isE2ETestingEnabled()) return;
    if (status !== "pending") return;

    async function autoVerify() {
      setStatus("verifying");
      try {
        const response = await fetch("/api/captcha/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: E2E_TEST_CAPTCHA_TOKEN }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus("passed");
          onPass?.(E2E_TEST_CAPTCHA_TOKEN);
        } else {
          setStatus("error");
          setErrorMessage(data.error || "E2E captcha verification failed");
        }
      } catch {
        setStatus("error");
        setErrorMessage("Failed to verify E2E captcha");
      }
    }

    autoVerify();
  }, [status, onPass]);

  const handleVerify = useCallback(
    async (token: string) => {
      setStatus("verifying");
      setErrorMessage(null);

      try {
        const response = await fetch("/api/captcha/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus("passed");
          onPass?.(token);
        } else {
          setStatus("error");
          setErrorMessage(data.error || "Verification failed");
        }
      } catch {
        setStatus("error");
        setErrorMessage("Failed to verify captcha");
      }
    },
    [onPass]
  );

  const handleExpire = useCallback(() => {
    setStatus("pending");
    setErrorMessage("Captcha expired. Please try again.");
  }, []);

  const handleError = useCallback(() => {
    setStatus("error");
    setErrorMessage("Captcha error. Please refresh and try again.");
  }, []);

  if (status === "passed") {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>

      <div className="mt-6">
        <ReCaptcha
          onVerify={handleVerify}
          onExpire={handleExpire}
          onError={handleError}
          disabled={status === "verifying"}
        />
      </div>

      {status === "verifying" && (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Verifying...
        </p>
      )}

      {errorMessage && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
