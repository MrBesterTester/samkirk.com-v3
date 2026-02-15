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

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Page header */}
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">
        Interview me NOW
      </h1>
      <p className="mt-4 text-lg text-text-secondary">
        These tools help you, the hiring manager, quickly evaluate whether I am
        a good fit for your job opportunity:
      </p>
      <ul className="mt-3 ml-6 space-y-2 list-disc text-lg text-text-secondary">
        <li>Evaluate my fitness: strong, average and weak aspects</li>
        <li>Generate a tailored resume</li>
      </ul>
      <p className="mt-2 text-lg text-text-secondary">
        Or just have a casual chat about my professional experience.
      </p>
      <ul className="mt-3 ml-6 space-y-2 list-disc text-lg text-text-secondary">
        <li>
          File inputs can be in .docx, .html, .txt, or .md format.
          <ul className="mt-1 ml-5 space-y-1 list-[circle]">
            <li>You can also paste or link in your job description. (Sorry, no .pdf inputs.)</li>
          </ul>
        </li>
        <li>
          Downloads are a complete .zip package with both inputs and outputs of
          your session for traceability. Typically, you'll select the output
          folder after it's unzipped and choose your file in the formats of .txt,
          .md and .html.
        </li>
      </ul>

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
            {/* Actions bar — action buttons + downloads + reset (top strip) */}
            {(state.downloads.length > 0 || state.messages.length > 0 || jobLoaded) && (
              <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
                {/* Analyze My Fit + Generate Resume — visible when job loaded and no flow active */}
                {jobLoaded && !flowActive && (
                  <>
                    <button
                      type="button"
                      onClick={triggerFit}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
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
                          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                        />
                      </svg>
                      Analyze My Fit
                    </button>
                    <button
                      type="button"
                      onClick={triggerResume}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
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
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                      Generate Resume
                    </button>
                  </>
                )}

                {/* Download buttons */}
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

                {/* Reset button — icon-only with tooltip */}
                {state.messages.length > 0 && (
                  <button
                    type="button"
                    onClick={newConversation}
                    title="New Conversation"
                    className="ml-auto inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white p-1 text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
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
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                      />
                    </svg>
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
