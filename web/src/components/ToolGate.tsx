"use client";

import { useCallback, useEffect, useState } from "react";
import { CaptchaGate } from "./ReCaptcha";

// ============================================================================
// Types
// ============================================================================

export interface ToolGateProps {
  /** Content to show once captcha is passed */
  children: React.ReactNode;
  /** Tool-specific title for the captcha gate */
  toolName?: string;
}

type GateStatus = "loading" | "init-session" | "captcha" | "ready" | "error";

// ============================================================================
// Component
// ============================================================================

/**
 * A gate component that ensures session is initialized and captcha is passed
 * before showing tool content.
 *
 * Flow:
 * 1. Initialize session (POST /api/session/init)
 * 2. Show captcha gate
 * 3. On captcha pass, show children
 */
export function ToolGate({ children, toolName }: ToolGateProps) {
  const [status, setStatus] = useState<GateStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize session on mount
  useEffect(() => {
    let cancelled = false;

    async function initSession() {
      try {
        const response = await fetch("/api/session/init", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (cancelled) return;

        if (!response.ok) {
          setStatus("error");
          setErrorMessage("Failed to initialize session");
          return;
        }

        setStatus("captcha");
      } catch {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage("Failed to connect to server");
      }
    }

    initSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCaptchaPass = useCallback(() => {
    setStatus("ready");
  }, []);

  // Loading state
  if (status === "loading" || status === "init-session") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800/50 dark:bg-red-900/20">
        <p className="text-red-600 dark:text-red-400">
          {errorMessage || "Something went wrong"}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Refresh page
        </button>
      </div>
    );
  }

  // Captcha gate
  if (status === "captcha") {
    return (
      <CaptchaGate
        title={
          toolName
            ? `Verify to use ${toolName}`
            : "Please verify you're human"
        }
        description="Complete the captcha to access this tool."
        onPass={handleCaptchaPass}
      >
        {children}
      </CaptchaGate>
    );
  }

  // Ready - show children
  return <>{children}</>;
}
