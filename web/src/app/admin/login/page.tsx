"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const errorMessages: Record<string, string> = {
    AccessDenied:
      "Access denied. Only authorized administrators can sign in.",
    OAuthSignin: "Error starting the sign-in process. Please try again.",
    OAuthCallback: "Error during sign-in callback. Please try again.",
    OAuthAccountNotLinked:
      "This account is already linked to another user.",
    Default: "An error occurred during sign-in. Please try again.",
  };

  const errorMessage = error
    ? errorMessages[error] || errorMessages.Default
    : null;

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Admin Sign In
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in with your Google account to access the admin dashboard.
        </p>

        {errorMessage && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm text-red-800 dark:text-red-200">
              {errorMessage}
            </p>
          </div>
        )}

        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>

        <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-500">
          Only authorized administrators can access this area.
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="animate-pulse">
              <div className="h-8 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="mt-2 h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="mt-6 h-12 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
