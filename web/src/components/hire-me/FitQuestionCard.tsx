"use client";

import { useState } from "react";
import type { FitQuestionMessage } from "./ChatStream";

// ============================================================================
// Props
// ============================================================================

export interface FitQuestionCardProps {
  message: FitQuestionMessage;
  onAnswer?: (questionId: string, answer: string) => void;
  answered?: boolean;
  selectedAnswer?: string;
}

// ============================================================================
// FitQuestionCard
// ============================================================================

export function FitQuestionCard({
  message,
  onAnswer,
  answered = false,
  selectedAnswer,
}: FitQuestionCardProps) {
  const [selected, setSelected] = useState<string>("");
  const [freeText, setFreeText] = useState("");

  const hasOptions = message.options && message.options.length > 0;
  const currentAnswer = hasOptions ? selected : freeText;
  const canSubmit = currentAnswer.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit || !onAnswer) return;
    onAnswer(message.questionId, currentAnswer.trim());
  }

  // ---- Answered (read-only) state ----
  if (answered) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] space-y-3 rounded-xl border border-zinc-200 bg-white p-5 opacity-80 dark:border-zinc-700 dark:bg-zinc-800/50">
          {/* Progress */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Question {message.questionNumber} of {message.maxQuestions}
            </p>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Answered
            </span>
          </div>

          {/* Question */}
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {message.question}
          </p>

          {/* Selected answer */}
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-700/40">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {selectedAnswer}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---- Interactive state ----
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-800/50">
        {/* Progress + badge */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Question {message.questionNumber} of {message.maxQuestions}
          </p>
          {message.required ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
              Required
            </span>
          ) : (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
              Optional
            </span>
          )}
        </div>

        {/* Question text */}
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {message.question}
        </p>

        {/* Options (radio) or free-text (textarea) */}
        {hasOptions ? (
          <div className="space-y-2">
            {message.options!.map((option) => (
              <label
                key={option}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  selected === option
                    ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                }`}
              >
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    selected === option
                      ? "border-blue-600 dark:border-blue-400"
                      : "border-zinc-300 dark:border-zinc-600"
                  }`}
                >
                  {selected === option && (
                    <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </div>
                <span className="text-sm text-zinc-800 dark:text-zinc-200">
                  {option}
                </span>
                <input
                  type="radio"
                  name={`question-${message.questionId}`}
                  value={option}
                  checked={selected === option}
                  onChange={() => setSelected(option)}
                  className="sr-only"
                />
              </label>
            ))}
          </div>
        ) : (
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Type your answer..."
            rows={3}
            className="w-full resize-none rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          />
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
}
