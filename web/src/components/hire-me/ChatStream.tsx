"use client";

import { useEffect, useRef } from "react";

// ============================================================================
// Message Types (discriminated union)
// ============================================================================

interface BaseMessage {
  id: string;
  timestamp: string;
}

export interface UserMessage extends BaseMessage {
  type: "user";
  content: string;
}

export interface AssistantMessage extends BaseMessage {
  type: "assistant";
  content: string;
}

export interface SystemMessage extends BaseMessage {
  type: "system";
  content: string;
}

export interface ErrorMessage extends BaseMessage {
  type: "error";
  content: string;
  retryable: boolean;
}

export interface FitQuestionMessage extends BaseMessage {
  type: "fit-question";
  questionId: string;
  question: string;
  options?: string[];
}

export interface FitReportMessage extends BaseMessage {
  type: "fit-report";
  reportId: string;
  summary: string;
  score?: number;
}

export interface ResumePreviewMessage extends BaseMessage {
  type: "resume-preview";
  resumeId: string;
  title: string;
}

export type ChatMessage =
  | UserMessage
  | AssistantMessage
  | SystemMessage
  | ErrorMessage
  | FitQuestionMessage
  | FitReportMessage
  | ResumePreviewMessage;

// ============================================================================
// Props
// ============================================================================

export interface ChatStreamProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onRetry?: (messageId: string) => void;
}

// ============================================================================
// Sub-components
// ============================================================================

function UserBubble({ message }: { message: UserMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-blue-600 px-4 py-3 text-white dark:bg-blue-500">
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </div>
        <p className="mt-1 text-xs text-blue-200">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

function AssistantBubble({ message }: { message: AssistantMessage }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
        <p className="mb-1 text-xs font-medium text-blue-600 dark:text-blue-400">
          Sam Kirk
        </p>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-900 dark:text-zinc-50">
          {message.content}
        </div>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

function SystemText({ message }: { message: SystemMessage }) {
  return (
    <div className="flex justify-center">
      <p className="max-w-[85%] text-center text-xs text-zinc-400 dark:text-zinc-500">
        {message.content}
      </p>
    </div>
  );
}

function ErrorCard({
  message,
  onRetry,
}: {
  message: ErrorMessage;
  onRetry?: (messageId: string) => void;
}) {
  return (
    <div className="flex justify-center">
      <div className="max-w-[85%] rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/50 dark:bg-red-900/20">
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
            <svg
              className="h-3.5 w-3.5 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-red-800 dark:text-red-300">
              {message.content}
            </p>
            {message.retryable && onRetry && (
              <button
                type="button"
                onClick={() => onRetry(message.id)}
                className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FitQuestionPlaceholder({ message }: { message: FitQuestionMessage }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800/50 dark:bg-blue-900/20">
        <p className="mb-1 text-xs font-medium text-blue-600 dark:text-blue-400">
          Fit Question
        </p>
        <p className="text-sm text-zinc-900 dark:text-zinc-50">
          {message.question}
        </p>
      </div>
    </div>
  );
}

function FitReportPlaceholder({ message }: { message: FitReportMessage }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800/50 dark:bg-green-900/20">
        <p className="mb-1 text-xs font-medium text-green-600 dark:text-green-400">
          Fit Report
        </p>
        <p className="text-sm text-zinc-900 dark:text-zinc-50">
          {message.summary}
        </p>
        {message.score !== undefined && (
          <p className="mt-1 text-xs text-green-600 dark:text-green-400">
            Score: {message.score}%
          </p>
        )}
      </div>
    </div>
  );
}

function ResumePreviewPlaceholder({
  message,
}: {
  message: ResumePreviewMessage;
}) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 dark:border-purple-800/50 dark:bg-purple-900/20">
        <p className="mb-1 text-xs font-medium text-purple-600 dark:text-purple-400">
          Resume Preview
        </p>
        <p className="text-sm text-zinc-900 dark:text-zinc-50">
          {message.title}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Welcome Message
// ============================================================================

function WelcomeMessage() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
        <p className="mb-1 text-xs font-medium text-blue-600 dark:text-blue-400">
          Sam Kirk
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-900 dark:text-zinc-50">
          Hi! I&apos;m here to answer questions about my career, skills, and
          professional experience. Feel free to ask about:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          <li className="flex items-center gap-2">
            <span className="text-blue-500">&bull;</span>
            Work history and experience
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-500">&bull;</span>
            Technical skills and projects
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-500">&bull;</span>
            Education and certifications
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-500">&bull;</span>
            Availability and location preferences
          </li>
        </ul>
        <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
          Add a job posting above to unlock fit analysis and custom resume
          generation!
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Typing Indicator
// ============================================================================

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
        <p className="mb-1 text-xs font-medium text-blue-600 dark:text-blue-400">
          Sam Kirk
        </p>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Message Renderer
// ============================================================================

function MessageRenderer({
  message,
  onRetry,
}: {
  message: ChatMessage;
  onRetry?: (messageId: string) => void;
}) {
  switch (message.type) {
    case "user":
      return <UserBubble message={message} />;
    case "assistant":
      return <AssistantBubble message={message} />;
    case "system":
      return <SystemText message={message} />;
    case "error":
      return <ErrorCard message={message} onRetry={onRetry} />;
    case "fit-question":
      return <FitQuestionPlaceholder message={message} />;
    case "fit-report":
      return <FitReportPlaceholder message={message} />;
    case "resume-preview":
      return <ResumePreviewPlaceholder message={message} />;
  }
}

// ============================================================================
// ChatStream Component
// ============================================================================

export function ChatStream({
  messages,
  isLoading = false,
  onRetry,
}: ChatStreamProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or when loading state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-4">
        {/* Welcome message when empty */}
        {messages.length === 0 && <WelcomeMessage />}

        {/* Message list */}
        {messages.map((message) => (
          <MessageRenderer
            key={message.id}
            message={message}
            onRetry={onRetry}
          />
        ))}

        {/* Typing indicator when loading */}
        {isLoading && <TypingIndicator />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
