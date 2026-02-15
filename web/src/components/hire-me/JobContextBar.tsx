"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================================
// Types
// ============================================================================

export type InputMode = "paste" | "url" | "file";

export interface JobInputData {
  text?: string;
  url?: string;
  file?: File;
}

type BarState = "collapsed-empty" | "expanded" | "collapsed-loaded";

interface StoredJobContext {
  mode: InputMode;
  text?: string;
  url?: string;
  // Files cannot be serialized to sessionStorage
}

// ============================================================================
// Props
// ============================================================================

export interface JobContextBarProps {
  onJobLoaded: (mode: InputMode, data: JobInputData) => void;
  onJobCleared: () => void;
  isLoading?: boolean;
  /** Display title for the loaded job (e.g. extracted from posting) */
  jobTitle?: string;
  /** Display company for the loaded job */
  jobCompany?: string;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = "hire-me-job-context";

// ============================================================================
// Component
// ============================================================================

export function JobContextBar({
  onJobLoaded,
  onJobCleared,
  isLoading = false,
  jobTitle,
  jobCompany,
}: JobContextBarProps) {
  const [barState, setBarState] = useState<BarState>("collapsed-empty");
  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [pasteText, setPasteText] = useState("");
  const [urlText, setUrlText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track whether we already restored from storage (to fire onJobLoaded once)
  const restoredRef = useRef(false);

  // --------------------------------------------------------------------------
  // Restore from sessionStorage on mount
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const stored: StoredJobContext = JSON.parse(raw);

      if (stored.mode === "paste" && stored.text) {
        setInputMode("paste");
        setPasteText(stored.text);
        setBarState("collapsed-loaded");
        onJobLoaded("paste", { text: stored.text });
      } else if (stored.mode === "url" && stored.url) {
        setInputMode("url");
        setUrlText(stored.url);
        setBarState("collapsed-loaded");
        onJobLoaded("url", { url: stored.url });
      }
      // File inputs cannot be restored from sessionStorage
    } catch {
      // Ignore parse errors
    }
    // onJobLoaded is intentionally excluded — we only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------------------------------
  // Persist to sessionStorage
  // --------------------------------------------------------------------------
  const persist = useCallback((mode: InputMode, data: JobInputData) => {
    try {
      const payload: StoredJobContext = { mode };
      if (mode === "paste") payload.text = data.text;
      if (mode === "url") payload.url = data.url;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // quota errors
    }
  }, []);

  const clearStorage = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      let data: JobInputData = {};

      if (inputMode === "paste" && pasteText.trim()) {
        data = { text: pasteText };
      } else if (inputMode === "url" && urlText.trim()) {
        data = { url: urlText };
      } else if (inputMode === "file" && selectedFile) {
        data = { file: selectedFile };
      } else {
        return; // nothing valid to submit
      }

      persist(inputMode, data);
      setBarState("collapsed-loaded");
      onJobLoaded(inputMode, data);
    },
    [inputMode, pasteText, urlText, selectedFile, persist, onJobLoaded],
  );

  const handleCancel = useCallback(() => {
    // Return to whatever state is appropriate
    // If there was previously loaded data, go back to loaded; otherwise empty
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        setBarState("collapsed-loaded");
      } else {
        setBarState("collapsed-empty");
      }
    } catch {
      setBarState("collapsed-empty");
    }
  }, []);

  const handleSwap = useCallback(() => {
    setBarState("expanded");
  }, []);

  const handleRemove = useCallback(() => {
    setPasteText("");
    setUrlText("");
    setSelectedFile(null);
    clearStorage();
    setBarState("collapsed-empty");
    onJobCleared();
  }, [clearStorage, onJobCleared]);

  const handleExpand = useCallback(() => {
    setBarState("expanded");
  }, []);

  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------
  const isValid =
    (inputMode === "paste" && pasteText.trim().length > 0) ||
    (inputMode === "url" && urlText.trim().length > 0) ||
    (inputMode === "file" && selectedFile !== null);

  // --------------------------------------------------------------------------
  // Display label for loaded state
  // --------------------------------------------------------------------------
  const loadedLabel = jobTitle
    ? `${jobTitle}${jobCompany ? ` at ${jobCompany}` : ""}`
    : "Job posting loaded";

  // ==========================================================================
  // Render: Collapsed-empty
  // ==========================================================================
  if (barState === "collapsed-empty") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Add a job posting to enable fit analysis and custom resume
          </p>
          <button
            type="button"
            onClick={handleExpand}
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Add Job
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Render: Collapsed-loaded
  // ==========================================================================
  if (barState === "collapsed-loaded") {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-900/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Checkmark icon */}
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </span>
            <span className="truncate text-sm font-medium text-blue-800 dark:text-blue-300">
              {loadedLabel}
            </span>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={handleSwap}
              disabled={isLoading}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Load New Job
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isLoading}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Remove Current Job
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Render: Expanded (input form)
  // ==========================================================================
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800/50">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mode Tabs */}
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          {([
            { mode: "paste" as const, label: "Paste Text" },
            { mode: "url" as const, label: "Enter URL" },
            { mode: "file" as const, label: "Upload File" },
          ] as const).map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setInputMode(mode)}
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                inputMode === mode
                  ? "bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-50"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Paste Mode */}
        {inputMode === "paste" && (
          <div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste the full job posting text here..."
              className="h-48 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
              disabled={isLoading}
            />
          </div>
        )}

        {/* URL Mode */}
        {inputMode === "url" && (
          <div>
            <input
              type="url"
              value={urlText}
              onChange={(e) => setUrlText(e.target.value)}
              placeholder="https://example.com/jobs/..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
              disabled={isLoading}
            />
          </div>
        )}

        {/* File Mode */}
        {inputMode === "file" && (
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors ${
                selectedFile
                  ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                  : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.html,.htm,.txt,.md"
                onChange={(e) =>
                  setSelectedFile(e.target.files?.[0] || null)
                }
                className="hidden"
                disabled={isLoading}
              />
              {selectedFile ? (
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {selectedFile.name}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Click to select a file
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    DOCX, HTML, TXT, MD (max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Loading...
              </span>
            ) : (
              "Load Job"
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
