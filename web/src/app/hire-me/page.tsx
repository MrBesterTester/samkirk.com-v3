"use client";

import { JobContextBar, ChatStream, ChatInput } from "@/components/hire-me";
import { ToolGate } from "@/components/ToolGate";
import { useHireMe } from "@/hooks/useHireMe";

export default function HireMePage() {
  const {
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
  } = useHireMe();

  const handlePreset = (preset: "fit" | "resume") => {
    if (preset === "fit") {
      triggerFit();
    } else {
      triggerResume();
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Page header */}
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">
        Hire Me
      </h1>
      <p className="mt-4 text-lg text-text-secondary">
        These tools help you, the hiring manager, quickly evaluate whether I am
        good fit for your job opportunity.
      </p>

      {/* Job Context Bar — outside ToolGate */}
      <div className="mt-8">
        <JobContextBar
          onJobLoaded={loadJob}
          onJobCleared={clearJob}
          isLoading={state.isLoading}
          jobTitle={jobTitle}
          jobCompany={jobCompany}
        />
      </div>

      {/* ToolGate wrapping chat area */}
      <div className="mt-6">
        <ToolGate toolName="Hire Me Tools">
          {/* Chat container with fixed height for scrollable stream */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-primary">
            {/* Actions bar — downloads + new conversation (top strip) */}
            {(state.downloads.length > 0 || state.messages.length > 0) && (
              <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
                {state.downloads.map((entry) => (
                  <button
                    key={entry.submissionId}
                    type="button"
                    onClick={() => download(entry.submissionId, entry.type)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    {entry.label}
                  </button>
                ))}

                {state.messages.length > 0 && (
                  <button
                    type="button"
                    onClick={newConversation}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    New Conversation
                  </button>
                )}
              </div>
            )}

            {/* ChatStream — scrollable area */}
            <div className="flex flex-col h-[32rem] sm:h-[36rem]">
              <ChatStream
                messages={state.messages}
                isLoading={state.isLoading}
                onAnswer={answerFitQuestion}
                answeredQuestions={state.answeredQuestions}
                onPreset={handlePreset}
                jobLoaded={jobLoaded}
                flowActive={flowActive}
              />
            </div>

            {/* ChatInput — textarea + send */}
            <ChatInput
              onSend={sendMessage}
              isLoading={state.isLoading}
            />
          </div>
        </ToolGate>
      </div>
    </div>
  );
}
