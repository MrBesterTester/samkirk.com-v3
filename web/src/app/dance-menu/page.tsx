"use client";

import { useState, useEffect } from "react";

interface DanceMenuFormat {
  extension: string;
  name: string;
  url: string;
}

interface DanceMenuData {
  available: boolean;
  htmlContent?: string;
  formats: DanceMenuFormat[];
}

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; data: DanceMenuData }
  | { status: "error"; message: string };

function getFormatIcon(extension: string): JSX.Element {
  switch (extension) {
    case "html":
      return (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      );
    case "md":
      return (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      );
    case "txt":
      return (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case "pdf":
      return (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    default:
      return (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      );
  }
}

export default function DanceMenuPage() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    async function fetchMenu() {
      try {
        const response = await fetch("/api/dance-menu");
        if (!response.ok) {
          throw new Error("Failed to fetch menu");
        }
        const data: DanceMenuData = await response.json();
        setLoadState({ status: "loaded", data });
      } catch (error) {
        setLoadState({
          status: "error",
          message:
            error instanceof Error ? error.message : "Failed to load menu",
        });
      }
    }

    fetchMenu();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Dance Menu
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        View and download the current weekly dance menu.
      </p>

      {/* Loading state */}
      {loadState.status === "loading" && (
        <div className="mt-12 flex items-center justify-center">
          <svg
            className="h-8 w-8 animate-spin text-purple-600"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

      {/* Error state */}
      {loadState.status === "error" && (
        <div className="mt-12 rounded-xl border border-red-200 bg-red-50 p-8 dark:border-red-900 dark:bg-red-950/30">
          <div className="flex items-center gap-3">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-red-800 dark:text-red-200">{loadState.message}</p>
          </div>
        </div>
      )}

      {/* Loaded state - No menu available */}
      {loadState.status === "loaded" && !loadState.data.available && (
        <div className="mt-12 rounded-xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              No dance menu has been published yet. Check back soon!
            </p>
          </div>
        </div>
      )}

      {/* Loaded state - Menu available */}
      {loadState.status === "loaded" && loadState.data.available && (
        <>
          {/* Download buttons */}
          <div className="mt-8">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Download in your preferred format
            </h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {loadState.data.formats.map((format) => (
                <a
                  key={format.extension}
                  href={format.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  {getFormatIcon(format.extension)}
                  {format.name}
                </a>
              ))}
            </div>
          </div>

          {/* HTML Content Display */}
          {loadState.data.htmlContent && (
            <div className="mt-8">
              <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Current Menu
                  </h2>
                </div>
                <div className="p-6">
                  <div
                    className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-purple-600 dark:prose-a:text-purple-400"
                    dangerouslySetInnerHTML={{
                      __html: loadState.data.htmlContent,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Fallback if no HTML content but menu is available */}
          {!loadState.data.htmlContent && (
            <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-purple-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                  The dance menu is available for download. Click one of the
                  download buttons above to get your copy.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
