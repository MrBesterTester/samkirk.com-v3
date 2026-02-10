"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ToolGate } from "@/components";

// ============================================================================
// Types
// ============================================================================

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

type ChatStatus =
  | "idle" // Ready to send messages
  | "sending" // Sending a message
  | "error"; // Error state

interface ChatState {
  status: ChatStatus;
  conversationId: string | null;
  submissionId: string | null;
  messages: ChatMessage[];
  turnCount: number;
  downloadReady: boolean;
  error: string | null;
  contactEmail?: string;
}

// ============================================================================
// Chat Message Component
// ============================================================================

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isLatest: boolean;
}

function ChatMessageBubble({ message, isLatest }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} ${isLatest ? "animate-fadeIn" : ""}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white dark:bg-blue-500"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
        }`}
      >
        {/* Role indicator for assistant */}
        {!isUser && (
          <p className="mb-1 text-xs font-medium text-blue-600 dark:text-blue-400">
            Sam Kirk
          </p>
        )}
        {/* Message content - preserve whitespace and line breaks */}
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </div>
        {/* Timestamp */}
        <p
          className={`mt-1 text-xs ${
            isUser
              ? "text-blue-200"
              : "text-zinc-400 dark:text-zinc-500"
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Welcome Message Component
// ============================================================================

function WelcomeMessage() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
        <p className="mb-1 text-xs font-medium text-blue-600 dark:text-blue-400">
          Sam Kirk
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-900 dark:text-zinc-50">
          Hi! I&apos;m here to answer questions about my career, skills, and professional experience. Feel free to ask about:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          <li className="flex items-center gap-2">
            <span className="text-blue-500">•</span>
            Work history and experience
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-500">•</span>
            Technical skills and projects
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-500">•</span>
            Education and certifications
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-500">•</span>
            Availability and location preferences
          </li>
        </ul>
        <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
          What would you like to know?
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Typing Indicator Component
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
// Chat Input Component
// ============================================================================

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}

function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !disabled) {
        onSend(input.trim());
        setInput("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Type your question..."}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
        maxLength={2000}
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        aria-label="Send message"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </form>
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
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800/50 dark:bg-red-900/20">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
        <svg
          className="h-5 w-5 text-red-600 dark:text-red-400"
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
      <h3 className="font-semibold text-red-800 dark:text-red-300">
        Something went wrong
      </h3>
      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{message}</p>
      {contactEmail && (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
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
        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
      >
        Try Again
      </button>
    </div>
  );
}

// ============================================================================
// Chat Actions Component
// ============================================================================

interface ChatActionsProps {
  submissionId: string | null;
  downloadReady: boolean;
  onNewConversation: () => void;
  messageCount: number;
}

function ChatActions({
  submissionId,
  downloadReady,
  onNewConversation,
  messageCount,
}: ChatActionsProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!submissionId || !downloadReady) return;

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
      a.download = `interview-transcript-${submissionId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download transcript. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-center gap-4">
        {/* Download button */}
        {downloadReady && submissionId && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200"
            title="Download transcript"
          >
            {downloading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-600" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
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
                <span>Download Transcript</span>
              </>
            )}
          </button>
        )}

        {/* Message count */}
        {messageCount > 0 && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {messageCount} message{messageCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* New conversation button */}
      <button
        onClick={onNewConversation}
        className="flex items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span>New Conversation</span>
      </button>
    </div>
  );
}

// ============================================================================
// Main Interview Tool Content Component
// ============================================================================

function InterviewToolContent() {
  const [chatState, setChatState] = useState<ChatState>({
    status: "idle",
    conversationId: null,
    submissionId: null,
    messages: [],
    turnCount: 0,
    downloadReady: false,
    error: null,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatState.messages]);

  // Send message handler
  const handleSendMessage = useCallback(
    async (message: string) => {
      // Add user message to UI immediately
      const userMessage: ChatMessage = {
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };

      setChatState((prev) => ({
        ...prev,
        status: "sending",
        messages: [...prev.messages, userMessage],
        error: null,
      }));

      try {
        const response = await fetch("/api/tools/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "message",
            message,
            conversationId: chatState.conversationId,
            submissionId: chatState.submissionId,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          setChatState((prev) => ({
            ...prev,
            status: "error",
            error: result.error || "Failed to send message",
            contactEmail: result.contactEmail,
          }));
          return;
        }

        // Add assistant message
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: result.message.content,
          timestamp: result.message.timestamp,
        };

        setChatState((prev) => ({
          ...prev,
          status: "idle",
          conversationId: result.conversationId,
          submissionId: result.submissionId,
          messages: [...prev.messages, assistantMessage],
          turnCount: result.turnCount,
          downloadReady: result.downloadReady,
        }));
      } catch (error) {
        console.error("Send error:", error);
        setChatState((prev) => ({
          ...prev,
          status: "error",
          error: "Failed to connect to server. Please try again.",
        }));
      }
    },
    [chatState.conversationId, chatState.submissionId]
  );

  // Start new conversation
  const handleNewConversation = useCallback(() => {
    setChatState({
      status: "idle",
      conversationId: null,
      submissionId: null,
      messages: [],
      turnCount: 0,
      downloadReady: false,
      error: null,
    });
  }, []);

  // Retry after error
  const handleRetry = useCallback(() => {
    setChatState((prev) => ({
      ...prev,
      status: "idle",
      error: null,
    }));
  }, []);

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Chat messages area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4"
      >
        <div className="space-y-4">
          {/* Welcome message when no conversation */}
          {chatState.messages.length === 0 && <WelcomeMessage />}

          {/* Message history */}
          {chatState.messages.map((message, index) => (
            <ChatMessageBubble
              key={`${message.timestamp}-${index}`}
              message={message}
              isLatest={index === chatState.messages.length - 1}
            />
          ))}

          {/* Typing indicator when sending */}
          {chatState.status === "sending" && <TypingIndicator />}

          {/* Error display */}
          {chatState.status === "error" && chatState.error && (
            <ErrorDisplay
              message={chatState.error}
              contactEmail={chatState.contactEmail}
              onRetry={handleRetry}
            />
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Actions bar */}
      <ChatActions
        submissionId={chatState.submissionId}
        downloadReady={chatState.downloadReady}
        onNewConversation={handleNewConversation}
        messageCount={chatState.messages.length}
      />

      {/* Input area */}
      <div className="border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <ChatInput
          onSend={handleSendMessage}
          disabled={chatState.status === "sending"}
          placeholder={
            chatState.status === "sending"
              ? "Waiting for response..."
              : "Ask about Sam's career, skills, or experience..."
          }
        />
        <p className="mt-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Page Component
// ============================================================================

export default function InterviewToolPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Interview Me NOW
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Have an interactive conversation to learn about Sam Kirk&apos;s
          career, skills, and professional experience.
        </p>
      </div>

      <ToolGate toolName="Interview Me Now">
        <InterviewToolContent />
      </ToolGate>

      {/* Info cards */}
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">
            Real-Time Chat
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Ask questions and get instant responses about career background
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
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h3 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">
            Career-Focused
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Answers are grounded in verified professional information
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
            Download Transcript
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Save the full conversation with source citations
          </p>
        </div>
      </div>
    </div>
  );
}
