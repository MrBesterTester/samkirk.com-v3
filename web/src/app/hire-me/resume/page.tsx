"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ToolGate } from "@/components";

// ============================================================================
// Types
// ============================================================================

type InputMode = "paste" | "url" | "file";

type FlowStatus =
  | "input" // Waiting for job input
  | "generating" // Generating resume
  | "complete" // Resume ready
  | "error"; // Error state

interface ResumeHeader {
  name: string;
  title: string;
  email?: string;
  location?: string;
}

interface ResumeInfo {
  header: ResumeHeader;
  summary: string;
  wordCount: number;
  experienceCount: number;
  skillsCount: number;
}

interface FlowState {
  status: FlowStatus;
  submissionId: string | null;
  resume: ResumeInfo | null;
  error: string | null;
}

// ============================================================================
// Job Input Form Component (reused from Fit tool pattern)
// ============================================================================

interface JobInputFormProps {
  onSubmit: (mode: InputMode, data: { text?: string; url?: string; file?: File }) => void;
  isLoading: boolean;
}

const JOB_INPUT_STORAGE_KEY = "hire-me-job-input";

function JobInputForm({ onSubmit, isLoading }: JobInputFormProps) {
  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [pasteText, setPasteText] = useState("");
  const [urlText, setUrlText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-populate from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(JOB_INPUT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { mode: string; text?: string; url?: string };
        if (parsed.mode === "paste" && parsed.text) {
          setInputMode("paste");
          setPasteText(parsed.text);
        } else if (parsed.mode === "url" && parsed.url) {
          setInputMode("url");
          setUrlText(parsed.url);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (inputMode === "paste") {
      try {
        sessionStorage.setItem(JOB_INPUT_STORAGE_KEY, JSON.stringify({ mode: "paste", text: pasteText }));
      } catch { /* quota errors */ }
      onSubmit("paste", { text: pasteText });
    } else if (inputMode === "url") {
      try {
        sessionStorage.setItem(JOB_INPUT_STORAGE_KEY, JSON.stringify({ mode: "url", url: urlText }));
      } catch { /* quota errors */ }
      onSubmit("url", { url: urlText });
    } else if (inputMode === "file" && selectedFile) {
      onSubmit("file", { file: selectedFile });
    }
  };

  const isValid =
    (inputMode === "paste" && pasteText.trim().length > 0) ||
    (inputMode === "url" && urlText.trim().length > 0) ||
    (inputMode === "file" && selectedFile !== null);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode Tabs */}
      <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        {[
          { mode: "paste" as const, label: "Paste Text" },
          { mode: "url" as const, label: "Enter URL" },
          { mode: "file" as const, label: "Upload File" },
        ].map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            onClick={() => setInputMode(mode)}
            className={`flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
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
          <label
            htmlFor="job-text"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Job Posting Text
          </label>
          <textarea
            id="job-text"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste the full job posting text here..."
            className="h-64 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
            disabled={isLoading}
          />
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Copy and paste the job description directly from the job posting.
          </p>
        </div>
      )}

      {/* URL Mode */}
      {inputMode === "url" && (
        <div>
          <label
            htmlFor="job-url"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Job Posting URL
          </label>
          <input
            type="url"
            id="job-url"
            value={urlText}
            onChange={(e) => setUrlText(e.target.value)}
            placeholder="https://example.com/jobs/..."
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
            disabled={isLoading}
          />
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Enter the URL of the job posting. If the URL cannot be fetched, you&apos;ll
            be asked to paste the text instead.
          </p>
        </div>
      )}

      {/* File Mode */}
      {inputMode === "file" && (
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Upload Job Description
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors ${
              selectedFile
                ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
              disabled={isLoading}
            />
            {selectedFile ? (
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {selectedFile.name}
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Click to select or drag and drop
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                  PDF, DOCX, TXT, MD (max 10MB)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Generating...
          </span>
        ) : (
          "Generate Custom Resume"
        )}
      </button>
    </form>
  );
}

// ============================================================================
// Resume Preview Component
// ============================================================================

interface ResumePreviewProps {
  resume: ResumeInfo;
}

function ResumePreview({ resume }: ResumePreviewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800/50">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {resume.header.name}
        </h3>
        <p className="mt-1 text-lg text-blue-600 dark:text-blue-400">
          {resume.header.title}
        </p>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          {resume.header.email && <span>{resume.header.email}</span>}
          {resume.header.location && <span>{resume.header.location}</span>}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800/50">
        <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">
          Professional Summary
        </h4>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">{resume.summary}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {resume.experienceCount}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Experience Entries</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {resume.skillsCount}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Skill Categories</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            2
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Page Resume</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Results Component
// ============================================================================

interface ResultsProps {
  resume: ResumeInfo;
  submissionId: string;
  onStartOver: () => void;
}

function Results({ resume, submissionId, onStartOver }: ResultsProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/submissions/${submissionId}/download`);
      if (!response.ok) {
        throw new Error("Download failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `custom-resume-${submissionId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download resume. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg
            className="h-8 w-8 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Your Custom Resume is Ready!
        </h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          A tailored 2-page resume has been generated based on the job requirements.
        </p>
      </div>

      {/* Preview */}
      <ResumePreview resume={resume} />

      {/* Note about factual accuracy */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-900/20">
        <div className="flex gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="font-semibold text-blue-800 dark:text-blue-300">
              Factual Accuracy Guaranteed
            </h4>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
              This resume only includes information from Sam Kirk&apos;s verified
              background. No experience, skills, or achievements have been invented.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {downloading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Downloading...
            </span>
          ) : (
            "Download Resume Bundle"
          )}
        </button>
        <button
          onClick={onStartOver}
          className="flex-1 rounded-lg border border-zinc-300 px-6 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Generate Another Resume
        </button>
      </div>

      {/* Download contents note */}
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        The download bundle includes: job input, resume (MD + HTML), and citations.
      </p>
    </div>
  );
}

// ============================================================================
// Error Display Component
// ============================================================================

interface ErrorDisplayProps {
  message: string;
  contactEmail?: string;
  onRetry: () => void;
}

function ErrorDisplay({ message, contactEmail, onRetry }: ErrorDisplayProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800/50 dark:bg-red-900/20">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
        <svg
          className="h-6 w-6 text-red-600 dark:text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">
        Something went wrong
      </h3>
      <p className="mt-2 text-red-600 dark:text-red-400">{message}</p>
      {contactEmail && (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Need help? Contact{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
          >
            {contactEmail}
          </a>
        </p>
      )}
      <button
        onClick={onRetry}
        className="mt-6 rounded-lg bg-red-600 px-6 py-2 font-medium text-white transition-colors hover:bg-red-700"
      >
        Try Again
      </button>
    </div>
  );
}

// ============================================================================
// Main Tool Content Component
// ============================================================================

function ResumeToolContent() {
  const [flowState, setFlowState] = useState<FlowState>({
    status: "input",
    submissionId: null,
    resume: null,
    error: null,
  });

  // Handle job input submission
  const handleInputSubmit = useCallback(
    async (
      mode: InputMode,
      data: { text?: string; url?: string; file?: File }
    ) => {
      setFlowState((prev) => ({ ...prev, status: "generating", error: null }));

      try {
        // For file mode, redirect to paste for now
        if (mode === "file") {
          setFlowState((prev) => ({
            ...prev,
            status: "error",
            error: "File upload is not yet implemented. Please paste the job text instead.",
          }));
          return;
        }

        const response = await fetch("/api/tools/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            ...(mode === "paste" ? { text: data.text } : { url: data.url }),
          }),
        });

        const result = await response.json();

        if (!result.success) {
          setFlowState((prev) => ({
            ...prev,
            status: "error",
            error: result.error,
          }));
          return;
        }

        setFlowState({
          status: "complete",
          submissionId: result.submissionId,
          resume: result.resume,
          error: null,
        });
      } catch (error) {
        console.error("Submit error:", error);
        setFlowState((prev) => ({
          ...prev,
          status: "error",
          error: "Failed to connect to server. Please try again.",
        }));
      }
    },
    []
  );

  // Start over
  const handleStartOver = useCallback(() => {
    setFlowState({
      status: "input",
      submissionId: null,
      resume: null,
      error: null,
    });
  }, []);

  // Render based on status
  if (flowState.status === "error" && flowState.error) {
    return (
      <ErrorDisplay
        message={flowState.error}
        onRetry={handleStartOver}
      />
    );
  }

  if (flowState.status === "input") {
    return (
      <JobInputForm
        onSubmit={handleInputSubmit}
        isLoading={false}
      />
    );
  }

  if (flowState.status === "generating") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
        <p className="mt-4 text-zinc-500 dark:text-zinc-400">
          Generating your custom resume...
        </p>
        <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
          This may take up to 30 seconds
        </p>
      </div>
    );
  }

  if (flowState.status === "complete" && flowState.resume && flowState.submissionId) {
    return (
      <Results
        resume={flowState.resume}
        submissionId={flowState.submissionId}
        onStartOver={handleStartOver}
      />
    );
  }

  // Fallback loading state
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600" />
    </div>
  );
}

// ============================================================================
// Page Component
// ============================================================================

export default function ResumeToolPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Get a Custom Resume
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Generate a tailored 2-page resume optimized for your specific job
          posting.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <ToolGate toolName="Get a Custom Resume">
          <ResumeToolContent />
        </ToolGate>
      </div>

      {/* Features */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <svg
              className="h-5 w-5 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">
            100% Factual
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Only uses verified information from Sam&apos;s background
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <svg
              className="h-5 w-5 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">
            2-Page Format
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Professional format optimized for readability
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <svg
              className="h-5 w-5 text-purple-600 dark:text-purple-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
          <h3 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">
            Multiple Formats
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Download as Markdown or HTML
          </p>
        </div>
      </div>
    </div>
  );
}
