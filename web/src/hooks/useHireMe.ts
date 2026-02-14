"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  InputMode,
  JobInputData,
  ChatMessage,
} from "@/components/hire-me";

// ============================================================================
// Types
// ============================================================================

export interface JobContext {
  loaded: boolean;
  inputMode: InputMode;
  text?: string;
  url?: string;
  fileName?: string;
  file?: File; // in-memory only, never serialized
  title?: string; // from /fit/start extracted
  company?: string; // from /fit/start extracted
}

export interface FitFlowState {
  active: boolean;
  flowState: string | null; // base64 X-Fit-Flow-State header
  submissionId: string | null;
  followUpsAsked: number;
  currentQuestionType: string | null;
}

export interface ResumeFlowState {
  active: boolean;
  submissionId: string | null;
}

export interface DownloadEntry {
  label: string;
  submissionId: string;
  type: "fit" | "resume" | "interview";
}

export interface HireMeState {
  jobContext: JobContext | null;
  messages: ChatMessage[];
  conversationId: string | null;
  fitFlow: FitFlowState;
  resumeFlow: ResumeFlowState;
  downloads: DownloadEntry[];
  answeredQuestions: Record<string, string>;
  isLoading: boolean;
}

export interface UseHireMeReturn {
  state: HireMeState;
  loadJob: (mode: InputMode, data: JobInputData) => void;
  clearJob: () => void;
  triggerFit: () => Promise<void>;
  triggerResume: () => Promise<void>;
  answerFitQuestion: (questionId: string, answer: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  newConversation: () => void;
  download: (submissionId: string, type: DownloadEntry["type"]) => Promise<void>;
  jobLoaded: boolean;
  flowActive: boolean;
  jobTitle: string | undefined;
  jobCompany: string | undefined;
}

// ============================================================================
// API Response Types
// ============================================================================

interface FitStartExtracted {
  title: string;
  company: string;
  seniority: string;
  locationType: string;
}

interface FitQuestion {
  type: string;
  text: string;
  options?: string[];
  required: boolean;
}

interface FitStartResponse {
  success: true;
  submissionId: string;
  status: "question" | "ready";
  question?: FitQuestion;
  extracted: FitStartExtracted;
}

interface FitAnswerQuestionResponse {
  success: true;
  status: "question";
  question: FitQuestion;
  followUpsAsked: number;
}

interface FitReportData {
  overallScore: string;
  recommendation: string;
  categories: Array<{ name: string; score: string; rationale: string }>;
  unknowns: string[];
}

interface FitAnswerCompleteResponse {
  success: true;
  status: "complete";
  report: FitReportData;
}

type FitAnswerResponse = FitAnswerQuestionResponse | FitAnswerCompleteResponse;

interface FitGenerateResponse {
  success: true;
  report: FitReportData;
}

interface ResumeResponse {
  success: true;
  submissionId: string;
  resume: {
    header: {
      name: string;
      title: string;
      email?: string;
      location?: string;
    };
    summary: string;
    wordCount: number;
    experienceCount: number;
    skillsCount: number;
  };
}

interface InterviewResponse {
  success: true;
  conversationId: string;
  submissionId: string;
  message: {
    role: string;
    content: string;
    timestamp: string;
  };
  turnCount: number;
  isComplete: boolean;
  downloadReady: boolean;
}

interface ApiErrorResponse {
  success: false;
  error: string;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = "hire-me-job-context";
const MAX_FIT_QUESTIONS = 5;

// ============================================================================
// Helpers
// ============================================================================

function makeId(): string {
  return crypto.randomUUID();
}

function makeTimestamp(): string {
  return new Date().toISOString();
}

function makeSystemMessage(content: string): ChatMessage {
  return {
    id: makeId(),
    timestamp: makeTimestamp(),
    type: "system",
    content,
  };
}

function makeErrorMessage(content: string): ChatMessage {
  return {
    id: makeId(),
    timestamp: makeTimestamp(),
    type: "error",
    content,
    retryable: true,
  };
}

function makeUserMessage(content: string): ChatMessage {
  return {
    id: makeId(),
    timestamp: makeTimestamp(),
    type: "user",
    content,
  };
}

/** Build the request body/options for fit/start or resume endpoints. */
function buildJobRequest(
  jobContext: JobContext,
): { body: BodyInit; headers?: Record<string, string> } {
  if (jobContext.inputMode === "file" && jobContext.file) {
    const formData = new FormData();
    formData.append("mode", "file");
    formData.append("file", jobContext.file);
    // No Content-Type header — browser sets multipart boundary
    return { body: formData };
  }

  const payload: Record<string, string> = { mode: jobContext.inputMode };
  if (jobContext.inputMode === "paste" && jobContext.text) {
    payload.text = jobContext.text;
  }
  if (jobContext.inputMode === "url" && jobContext.url) {
    payload.url = jobContext.url;
  }

  return {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  };
}

// ============================================================================
// Initial State
// ============================================================================

function createInitialState(): HireMeState {
  return {
    jobContext: null,
    messages: [],
    conversationId: null,
    fitFlow: {
      active: false,
      flowState: null,
      submissionId: null,
      followUpsAsked: 0,
      currentQuestionType: null,
    },
    resumeFlow: {
      active: false,
      submissionId: null,
    },
    downloads: [],
    answeredQuestions: {},
    isLoading: false,
  };
}

// ============================================================================
// Hook
// ============================================================================

export function useHireMe(): UseHireMeReturn {
  const [state, setState] = useState<HireMeState>(createInitialState);

  // Track whether we already restored from storage (fire once on mount)
  const restoredRef = useRef(false);

  // ------------------------------------------------------------------
  // Session storage restore
  // ------------------------------------------------------------------
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const stored: { mode: InputMode; text?: string; url?: string } =
        JSON.parse(raw);

      if (stored.mode === "paste" && stored.text) {
        setState((prev) => ({
          ...prev,
          jobContext: {
            loaded: true,
            inputMode: "paste",
            text: stored.text,
          },
        }));
      } else if (stored.mode === "url" && stored.url) {
        setState((prev) => ({
          ...prev,
          jobContext: {
            loaded: true,
            inputMode: "url",
            url: stored.url,
          },
        }));
      }
      // File inputs cannot be restored from sessionStorage
    } catch {
      // Ignore parse errors from corrupt/invalid storage
    }
  }, []);

  // ------------------------------------------------------------------
  // Session storage persistence helper
  // ------------------------------------------------------------------
  const persistJobContext = useCallback(
    (mode: InputMode, data: JobInputData) => {
      try {
        const payload: { mode: InputMode; text?: string; url?: string } = {
          mode,
        };
        if (mode === "paste") payload.text = data.text;
        if (mode === "url") payload.url = data.url;
        // File mode: cannot persist File objects
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // Quota errors — silently ignore
      }
    },
    [],
  );

  const clearJobStorage = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // ------------------------------------------------------------------
  // addMessage helper (appends to messages array)
  // ------------------------------------------------------------------
  const addMessage = useCallback((message: ChatMessage) => {
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }, []);

  // ------------------------------------------------------------------
  // Internal: generateFitReport
  // ------------------------------------------------------------------
  const generateFitReport = useCallback(
    async (
      flowStateHeader: string,
      submissionId: string,
      extracted: FitStartExtracted | null,
    ) => {
      addMessage(makeSystemMessage("Generating your fit report..."));

      const res = await fetch("/api/tools/fit/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flowState: flowStateHeader,
          submissionId,
        }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as ApiErrorResponse | null;
        throw new Error(errBody?.error ?? `Fit generate failed (${res.status})`);
      }

      const result = (await res.json()) as FitGenerateResponse;

      const reportMessage: ChatMessage = {
        id: makeId(),
        timestamp: makeTimestamp(),
        type: "fit-report",
        submissionId,
        overallScore: result.report.overallScore as "Well" | "Average" | "Poorly",
        recommendation: result.report.recommendation,
        categories: result.report.categories,
        unknowns: result.report.unknowns,
        extracted: {
          title: extracted?.title ?? null,
          company: extracted?.company ?? null,
        },
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, reportMessage],
        fitFlow: {
          ...prev.fitFlow,
          active: false,
          flowState: null,
          currentQuestionType: null,
        },
        downloads: [
          ...prev.downloads,
          {
            label: `Fit Report${extracted?.company ? ` - ${extracted.company}` : ""}`,
            submissionId,
            type: "fit" as const,
          },
        ],
        isLoading: false,
      }));
    },
    [addMessage],
  );

  // ------------------------------------------------------------------
  // loadJob
  // ------------------------------------------------------------------
  const loadJob = useCallback(
    (mode: InputMode, data: JobInputData) => {
      const jobContext: JobContext = {
        loaded: true,
        inputMode: mode,
        text: data.text,
        url: data.url,
        file: data.file,
        fileName: data.file?.name,
      };

      persistJobContext(mode, data);

      setState((prev) => ({
        ...prev,
        jobContext,
      }));
    },
    [persistJobContext],
  );

  // ------------------------------------------------------------------
  // clearJob
  // ------------------------------------------------------------------
  const clearJob = useCallback(() => {
    clearJobStorage();
    setState((prev) => ({
      ...prev,
      jobContext: null,
    }));
  }, [clearJobStorage]);

  // ------------------------------------------------------------------
  // triggerFit
  // ------------------------------------------------------------------
  const triggerFit = useCallback(async () => {
    const { jobContext, fitFlow, resumeFlow } = state;

    // Guards
    if (!jobContext || !jobContext.loaded) return;
    if (fitFlow.active || resumeFlow.active) return;

    setState((prev) => ({
      ...prev,
      isLoading: true,
      fitFlow: {
        ...prev.fitFlow,
        active: true,
        flowState: null,
        submissionId: null,
        followUpsAsked: 0,
        currentQuestionType: null,
      },
    }));

    addMessage(makeSystemMessage("Starting fit analysis..."));

    try {
      const { body, headers } = buildJobRequest(jobContext);

      const res = await fetch("/api/tools/fit/start", {
        method: "POST",
        headers,
        body,
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as ApiErrorResponse | null;
        throw new Error(errBody?.error ?? `Fit start failed (${res.status})`);
      }

      const flowStateHeader = res.headers.get("X-Fit-Flow-State") ?? "";
      const result = (await res.json()) as FitStartResponse;

      // Update jobContext with extracted title/company
      setState((prev) => ({
        ...prev,
        jobContext: prev.jobContext
          ? {
              ...prev.jobContext,
              title: result.extracted.title,
              company: result.extracted.company,
            }
          : prev.jobContext,
        fitFlow: {
          ...prev.fitFlow,
          flowState: flowStateHeader,
          submissionId: result.submissionId,
        },
      }));

      if (result.status === "question" && result.question) {
        const questionMessage: ChatMessage = {
          id: makeId(),
          timestamp: makeTimestamp(),
          type: "fit-question",
          submissionId: result.submissionId,
          questionId: `q-${Date.now()}`,
          questionNumber: 1,
          maxQuestions: MAX_FIT_QUESTIONS,
          required: result.question.required,
          question: result.question.text,
          options: result.question.options,
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, questionMessage],
          fitFlow: {
            ...prev.fitFlow,
            currentQuestionType: result.question!.type,
            followUpsAsked: 1,
          },
          isLoading: false,
        }));
      } else if (result.status === "ready") {
        // No questions needed — generate report directly
        await generateFitReport(
          flowStateHeader,
          result.submissionId,
          result.extracted,
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      addMessage(makeErrorMessage(message));
      setState((prev) => ({
        ...prev,
        isLoading: false,
        fitFlow: {
          ...prev.fitFlow,
          active: false,
          flowState: null,
        },
      }));
    }
  }, [state, addMessage, generateFitReport]);

  // ------------------------------------------------------------------
  // answerFitQuestion
  // ------------------------------------------------------------------
  const answerFitQuestion = useCallback(
    async (questionId: string, answer: string) => {
      const { fitFlow } = state;

      if (!fitFlow.active || !fitFlow.flowState || !fitFlow.submissionId) return;

      // Record the answer
      setState((prev) => ({
        ...prev,
        answeredQuestions: {
          ...prev.answeredQuestions,
          [questionId]: answer,
        },
        isLoading: true,
      }));

      try {
        const res = await fetch("/api/tools/fit/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flowState: fitFlow.flowState,
            submissionId: fitFlow.submissionId,
            questionType: fitFlow.currentQuestionType,
            response: answer,
          }),
        });

        if (!res.ok) {
          const errBody = (await res.json().catch(() => null)) as ApiErrorResponse | null;
          throw new Error(errBody?.error ?? `Fit answer failed (${res.status})`);
        }

        const result = (await res.json()) as FitAnswerResponse;

        if (result.status === "question") {
          const newFlowState = res.headers.get("X-Fit-Flow-State") ?? fitFlow.flowState;

          const questionMessage: ChatMessage = {
            id: makeId(),
            timestamp: makeTimestamp(),
            type: "fit-question",
            submissionId: fitFlow.submissionId,
            questionId: `q-${Date.now()}`,
            questionNumber: result.followUpsAsked,
            maxQuestions: MAX_FIT_QUESTIONS,
            required: result.question.required,
            question: result.question.text,
            options: result.question.options,
          };

          setState((prev) => ({
            ...prev,
            messages: [...prev.messages, questionMessage],
            fitFlow: {
              ...prev.fitFlow,
              flowState: newFlowState,
              currentQuestionType: result.question.type,
              followUpsAsked: result.followUpsAsked,
            },
            isLoading: false,
          }));
        } else if (result.status === "complete") {
          // Inline report — no separate generate call needed
          const extracted = state.jobContext
            ? {
                title: state.jobContext.title ?? "",
                company: state.jobContext.company ?? "",
                seniority: "",
                locationType: "",
              }
            : null;

          const reportMessage: ChatMessage = {
            id: makeId(),
            timestamp: makeTimestamp(),
            type: "fit-report",
            submissionId: fitFlow.submissionId,
            overallScore: result.report.overallScore as "Well" | "Average" | "Poorly",
            recommendation: result.report.recommendation,
            categories: result.report.categories,
            unknowns: result.report.unknowns,
            extracted: {
              title: extracted?.title ?? null,
              company: extracted?.company ?? null,
            },
          };

          setState((prev) => ({
            ...prev,
            messages: [...prev.messages, reportMessage],
            fitFlow: {
              ...prev.fitFlow,
              active: false,
              flowState: null,
              currentQuestionType: null,
            },
            downloads: [
              ...prev.downloads,
              {
                label: `Fit Report${extracted?.company ? ` - ${extracted.company}` : ""}`,
                submissionId: fitFlow.submissionId!,
                type: "fit" as const,
              },
            ],
            isLoading: false,
          }));
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        addMessage(makeErrorMessage(message));
        setState((prev) => ({
          ...prev,
          isLoading: false,
          fitFlow: {
            ...prev.fitFlow,
            active: false,
            flowState: null,
          },
        }));
      }
    },
    [state, addMessage],
  );

  // ------------------------------------------------------------------
  // triggerResume
  // ------------------------------------------------------------------
  const triggerResume = useCallback(async () => {
    const { jobContext, fitFlow, resumeFlow } = state;

    // Guards
    if (!jobContext || !jobContext.loaded) return;
    if (fitFlow.active || resumeFlow.active) return;

    setState((prev) => ({
      ...prev,
      isLoading: true,
      resumeFlow: {
        active: true,
        submissionId: null,
      },
    }));

    addMessage(makeSystemMessage("Generating your custom resume..."));

    try {
      const { body, headers } = buildJobRequest(jobContext);

      const res = await fetch("/api/tools/resume", {
        method: "POST",
        headers,
        body,
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as ApiErrorResponse | null;
        throw new Error(errBody?.error ?? `Resume generation failed (${res.status})`);
      }

      const result = (await res.json()) as ResumeResponse;

      const previewMessage: ChatMessage = {
        id: makeId(),
        timestamp: makeTimestamp(),
        type: "resume-preview",
        submissionId: result.submissionId,
        header: result.resume.header,
        summary: result.resume.summary,
        wordCount: result.resume.wordCount,
        experienceCount: result.resume.experienceCount,
        skillsCount: result.resume.skillsCount,
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, previewMessage],
        resumeFlow: {
          active: false,
          submissionId: result.submissionId,
        },
        downloads: [
          ...prev.downloads,
          {
            label: `Custom Resume${jobContext.company ? ` - ${jobContext.company}` : ""}`,
            submissionId: result.submissionId,
            type: "resume" as const,
          },
        ],
        isLoading: false,
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      addMessage(makeErrorMessage(message));
      setState((prev) => ({
        ...prev,
        isLoading: false,
        resumeFlow: {
          active: false,
          submissionId: null,
        },
      }));
    }
  }, [state, addMessage]);

  // ------------------------------------------------------------------
  // sendMessage (interview / free chat)
  // ------------------------------------------------------------------
  const sendMessage = useCallback(
    async (text: string) => {
      // Push user message immediately
      const userMsg = makeUserMessage(text);
      addMessage(userMsg);

      setState((prev) => ({
        ...prev,
        isLoading: true,
      }));

      try {
        const res = await fetch("/api/tools/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "message",
            message: text,
            conversationId: state.conversationId,
            submissionId:
              state.fitFlow.submissionId ??
              state.resumeFlow.submissionId ??
              state.downloads.find((d) => d.type === "interview")?.submissionId ??
              null,
          }),
        });

        if (!res.ok) {
          const errBody = (await res.json().catch(() => null)) as ApiErrorResponse | null;
          throw new Error(errBody?.error ?? `Interview failed (${res.status})`);
        }

        const result = (await res.json()) as InterviewResponse;

        const assistantMsg: ChatMessage = {
          id: makeId(),
          timestamp: result.message.timestamp,
          type: "assistant",
          content: result.message.content,
        };

        setState((prev) => {
          const next: HireMeState = {
            ...prev,
            messages: [...prev.messages, assistantMsg],
            conversationId: result.conversationId,
            isLoading: false,
          };

          if (result.downloadReady) {
            const existingIdx = prev.downloads.findIndex(
              (d) => d.type === "interview"
            );
            if (existingIdx === -1) {
              next.downloads = [
                ...prev.downloads,
                {
                  label: "Interview Summary",
                  submissionId: result.submissionId,
                  type: "interview" as const,
                },
              ];
            } else if (prev.downloads[existingIdx].submissionId !== result.submissionId) {
              // Update the existing entry to point to the latest submissionId
              next.downloads = prev.downloads.map((d, i) =>
                i === existingIdx ? { ...d, submissionId: result.submissionId } : d
              );
            }
          }

          return next;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        addMessage(makeErrorMessage(message));
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    },
    [state.conversationId, state.fitFlow.submissionId, state.resumeFlow.submissionId, state.downloads, addMessage],
  );

  // ------------------------------------------------------------------
  // newConversation
  // ------------------------------------------------------------------
  const newConversation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: [],
      conversationId: null,
      fitFlow: {
        active: false,
        flowState: null,
        submissionId: null,
        followUpsAsked: 0,
        currentQuestionType: null,
      },
      resumeFlow: {
        active: false,
        submissionId: null,
      },
      answeredQuestions: {},
      isLoading: false,
      // Keep jobContext and downloads
    }));
  }, []);

  // ------------------------------------------------------------------
  // download
  // ------------------------------------------------------------------
  const download = useCallback(async (submissionId: string, type: DownloadEntry["type"]) => {
    try {
      const params = new URLSearchParams({ type });
      const res = await fetch(`/api/submissions/${submissionId}/download?${params}`);
      if (!res.ok) throw new Error("Download failed");

      // Use filename from Content-Disposition header if provided
      const disposition = res.headers.get("Content-Disposition");
      let filename = `submission-${submissionId}.zip`;
      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match?.[1]) {
          filename = match[1];
        }
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Download failed";
      addMessage(makeErrorMessage(message));
    }
  }, [addMessage]);

  // ------------------------------------------------------------------
  // Derived values
  // ------------------------------------------------------------------
  const jobLoaded = state.jobContext?.loaded ?? false;
  const flowActive = state.fitFlow.active || state.resumeFlow.active;
  const jobTitle = state.jobContext?.title;
  const jobCompany = state.jobContext?.company;

  return {
    state,
    loadJob,
    clearJob,
    triggerFit,
    triggerResume,
    answerFitQuestion,
    sendMessage,
    newConversation,
    download,
    jobLoaded,
    flowActive,
    jobTitle,
    jobCompany,
  };
}
