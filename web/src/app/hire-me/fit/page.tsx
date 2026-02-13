"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ToolGate } from "@/components";

// ============================================================================
// Types
// ============================================================================

type InputMode = "paste" | "url" | "file";

type FlowStatus =
  | "input" // Waiting for job input
  | "loading" // Processing
  | "question" // Follow-up question displayed
  | "generating" // Generating report
  | "complete" // Report ready
  | "error"; // Error state

interface Question {
  type: string;
  text: string;
  options?: string[];
  required: boolean;
}

interface ExtractedInfo {
  title: string | null;
  company: string | null;
  seniority: string;
  locationType: string;
}

interface ReportCategory {
  name: string;
  score: string;
  rationale: string;
}

interface Report {
  overallScore: string;
  recommendation: string;
  categories: ReportCategory[];
  unknowns: string[];
}

interface FlowState {
  status: FlowStatus;
  flowState: string | null; // Base64 encoded server state
  submissionId: string | null;
  extracted: ExtractedInfo | null;
  question: Question | null;
  followUpsAsked: number;
  report: Report | null;
  error: string | null;
}

// ============================================================================
// Score Badge Component
// ============================================================================

function ScoreBadge({ score }: { score: string }) {
  const colors =
    score === "Well"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : score === "Average"
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";

  const icon =
    score === "Well" ? "✓" : score === "Average" ? "~" : "✗";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${colors}`}
    >
      <span>{icon}</span>
      {score}
    </span>
  );
}

// ============================================================================
// Job Input Form Component
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
            Analyzing...
          </span>
        ) : (
          "Analyze Job Fit"
        )}
      </button>
    </form>
  );
}

// ============================================================================
// Follow-up Question Component
// ============================================================================

interface FollowUpQuestionProps {
  question: Question;
  onAnswer: (answer: string) => void;
  isLoading: boolean;
  questionNumber: number;
  maxQuestions: number;
}

function FollowUpQuestion({
  question,
  onAnswer,
  isLoading,
  questionNumber,
  maxQuestions,
}: FollowUpQuestionProps) {
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAnswer = selectedOption || answer;
    if (finalAnswer.trim()) {
      onAnswer(finalAnswer);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Follow-up Question {questionNumber} of {maxQuestions}
        </span>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          {question.required ? "Required" : "Optional"}
        </span>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800/50">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {question.text}
        </h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {question.options && question.options.length > 0 ? (
            <div className="space-y-2">
              {question.options.map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center rounded-lg border px-4 py-3 transition-colors ${
                    selectedOption === option
                      ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="follow-up-option"
                    value={option}
                    checked={selectedOption === option}
                    onChange={() => setSelectedOption(option)}
                    className="sr-only"
                    disabled={isLoading}
                  />
                  <span
                    className={`mr-3 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      selectedOption === option
                        ? "border-blue-500 bg-blue-500"
                        : "border-zinc-300 dark:border-zinc-600"
                    }`}
                  >
                    {selectedOption === option && (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300">{option}</span>
                </label>
              ))}
            </div>
          ) : (
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="h-32 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              disabled={isLoading}
            />
          )}

          <button
            type="submit"
            disabled={
              isLoading ||
              (!selectedOption && !answer.trim())
            }
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processing...
              </span>
            ) : (
              "Continue"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// Results Component
// ============================================================================

interface ResultsProps {
  report: Report;
  submissionId: string;
  extracted: ExtractedInfo | null;
  onStartOver: () => void;
}

function Results({ report, submissionId, extracted, onStartOver }: ResultsProps) {
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
      a.download = `fit-report-${submissionId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download report. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Fit Analysis Complete
        </h2>
        {extracted?.title && (
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {extracted.title}
            {extracted.company && ` at ${extracted.company}`}
          </p>
        )}
      </div>

      {/* Overall Score */}
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Overall Fit Score
        </p>
        <div className="mt-4">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-2xl font-bold ${
              report.overallScore === "Well"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : report.overallScore === "Average"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {report.overallScore === "Well" && "✓"}
            {report.overallScore === "Average" && "~"}
            {report.overallScore === "Poorly" && "✗"}
            {report.overallScore}
          </span>
        </div>
      </div>

      {/* Recommendation */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800/50">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
          Recommendation
        </h3>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {report.recommendation}
        </p>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Category Breakdown
        </h3>
        {report.categories.map((category) => (
          <div
            key={category.name}
            className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800/50"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-zinc-900 dark:text-zinc-50">
                {category.name}
              </h4>
              <ScoreBadge score={category.score} />
            </div>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              {category.rationale}
            </p>
          </div>
        ))}
      </div>

      {/* Unknowns */}
      {report.unknowns.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800/50 dark:bg-amber-900/20">
          <h3 className="font-semibold text-amber-800 dark:text-amber-300">
            Unknowns & Assumptions
          </h3>
          <ul className="mt-3 space-y-2">
            {report.unknowns.map((unknown, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400"
              >
                <span className="mt-1">•</span>
                {unknown}
              </li>
            ))}
          </ul>
        </div>
      )}

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
            "Download Full Report"
          )}
        </button>
        <button
          onClick={onStartOver}
          className="flex-1 rounded-lg border border-zinc-300 px-6 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Analyze Another Job
        </button>
      </div>
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

function FitToolContent() {
  const [flowState, setFlowState] = useState<FlowState>({
    status: "input",
    flowState: null,
    submissionId: null,
    extracted: null,
    question: null,
    followUpsAsked: 0,
    report: null,
    error: null,
  });

  // Generate report - defined first to avoid accessing before declaration
  const generateReport = useCallback(
    async (state: string, submissionId: string) => {
      try {
        const response = await fetch("/api/tools/fit/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flowState: state, submissionId }),
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

        setFlowState((prev) => ({
          ...prev,
          status: "complete",
          report: result.report,
        }));
      } catch (error) {
        console.error("Generate error:", error);
        setFlowState((prev) => ({
          ...prev,
          status: "error",
          error: "Failed to generate report. Please try again.",
        }));
      }
    },
    []
  );

  // Handle job input submission
  const handleInputSubmit = useCallback(
    async (
      mode: InputMode,
      data: { text?: string; url?: string; file?: File }
    ) => {
      setFlowState((prev) => ({ ...prev, status: "loading", error: null }));

      try {
        let response: Response;

        if (mode === "file") {
          // File upload mode — send as FormData (multipart/form-data)
          if (!data.file) {
            setFlowState((prev) => ({
              ...prev,
              status: "error",
              error: "Please select a file to upload.",
            }));
            return;
          }

          const formData = new FormData();
          formData.append("mode", "file");
          formData.append("file", data.file);

          response = await fetch("/api/tools/fit/start", {
            method: "POST",
            body: formData,
          });
        } else {
          // Paste or URL mode — send as JSON
          response = await fetch("/api/tools/fit/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode,
              ...(mode === "paste" ? { text: data.text } : { url: data.url }),
            }),
          });
        }

        const serverFlowState = response.headers.get("X-Fit-Flow-State");
        const result = await response.json();

        if (!result.success) {
          setFlowState((prev) => ({
            ...prev,
            status: "error",
            error: result.error,
          }));
          return;
        }

        if (result.status === "question") {
          setFlowState((prev) => ({
            ...prev,
            status: "question",
            flowState: serverFlowState,
            submissionId: result.submissionId,
            extracted: result.extracted,
            question: result.question,
            followUpsAsked: 1,
          }));
        } else if (result.status === "ready") {
          // No questions needed, generate report immediately
          setFlowState((prev) => ({
            ...prev,
            status: "generating",
            flowState: serverFlowState,
            submissionId: result.submissionId,
            extracted: result.extracted,
          }));

          // Call generate endpoint
          await generateReport(serverFlowState!, result.submissionId);
        }
      } catch (error) {
        console.error("Submit error:", error);
        setFlowState((prev) => ({
          ...prev,
          status: "error",
          error: "Failed to connect to server. Please try again.",
        }));
      }
    },
    [generateReport]
  );

  // Handle follow-up answer
  const handleAnswer = useCallback(
    async (answer: string) => {
      if (!flowState.flowState || !flowState.submissionId || !flowState.question) {
        return;
      }

      setFlowState((prev) => ({ ...prev, status: "loading" }));

      try {
        const response = await fetch("/api/tools/fit/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flowState: flowState.flowState,
            submissionId: flowState.submissionId,
            questionType: flowState.question.type,
            response: answer,
          }),
        });

        const serverFlowState = response.headers.get("X-Fit-Flow-State");
        const result = await response.json();

        if (!result.success) {
          setFlowState((prev) => ({
            ...prev,
            status: "error",
            error: result.error,
          }));
          return;
        }

        if (result.status === "question") {
          setFlowState((prev) => ({
            ...prev,
            status: "question",
            flowState: serverFlowState,
            question: result.question,
            followUpsAsked: result.followUpsAsked,
          }));
        } else if (result.status === "ready") {
          // Ready for report generation
          setFlowState((prev) => ({
            ...prev,
            status: "generating",
            flowState: serverFlowState,
          }));
          await generateReport(serverFlowState!, flowState.submissionId);
        } else if (result.status === "complete") {
          // Report already generated
          setFlowState((prev) => ({
            ...prev,
            status: "complete",
            report: result.report,
          }));
        }
      } catch (error) {
        console.error("Answer error:", error);
        setFlowState((prev) => ({
          ...prev,
          status: "error",
          error: "Failed to submit answer. Please try again.",
        }));
      }
    },
    [flowState.flowState, flowState.submissionId, flowState.question, generateReport]
  );

  // Start over
  const handleStartOver = useCallback(() => {
    setFlowState({
      status: "input",
      flowState: null,
      submissionId: null,
      extracted: null,
      question: null,
      followUpsAsked: 0,
      report: null,
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

  if (flowState.status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
        <p className="mt-4 text-zinc-500 dark:text-zinc-400">
          Analyzing job posting...
        </p>
      </div>
    );
  }

  if (flowState.status === "question" && flowState.question) {
    return (
      <FollowUpQuestion
        question={flowState.question}
        onAnswer={handleAnswer}
        isLoading={false}
        questionNumber={flowState.followUpsAsked}
        maxQuestions={5}
      />
    );
  }

  if (flowState.status === "generating") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
        <p className="mt-4 text-zinc-500 dark:text-zinc-400">
          Generating fit analysis report...
        </p>
        <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
          This may take a few seconds
        </p>
      </div>
    );
  }

  if (flowState.status === "complete" && flowState.report && flowState.submissionId) {
    return (
      <Results
        report={flowState.report}
        submissionId={flowState.submissionId}
        extracted={flowState.extracted}
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

export default function FitToolPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          How Do I Fit?
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Submit a job posting and get a detailed analysis of how well Sam Kirk
          fits the role.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <ToolGate toolName="How Do I Fit?">
          <FitToolContent />
        </ToolGate>
      </div>
    </div>
  );
}
