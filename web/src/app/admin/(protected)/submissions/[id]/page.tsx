import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubmission } from "@/lib/submission";
import type { SubmissionTool, SubmissionStatus } from "@/lib/firestore";

// No caching for detail views to always show latest data
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function getToolLabel(tool: SubmissionTool): string {
  const labels: Record<SubmissionTool, string> = {
    fit: "How Do I Fit?",
    resume: "Custom Resume",
    interview: "Interview Me",
  };
  return labels[tool];
}

function getToolColor(tool: SubmissionTool): string {
  const colors: Record<SubmissionTool, string> = {
    fit: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    resume: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    interview:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  };
  return colors[tool];
}

function getStatusLabel(status: SubmissionStatus): string {
  const labels: Record<SubmissionStatus, string> = {
    in_progress: "In Progress",
    complete: "Complete",
    blocked: "Blocked",
    error: "Error",
  };
  return labels[status];
}

function getStatusColor(status: SubmissionStatus): string {
  const colors: Record<SubmissionStatus, string> = {
    in_progress:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    complete:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    blocked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    error:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  };
  return colors[status];
}

function formatDate(timestamp: { toDate(): Date }): string {
  const date = timestamp.toDate();
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

function isEmptyObject(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null) return true;
  return Object.keys(obj).length === 0;
}

export default async function SubmissionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const submission = await getSubmission(id);

  if (!submission) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/submissions"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to Submissions
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Submission Details
          </h1>
        </div>
      </div>

      {/* Header info */}
      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getToolColor(submission.tool)}`}
          >
            {getToolLabel(submission.tool)}
          </span>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(submission.status)}`}
          >
            {getStatusLabel(submission.status)}
          </span>
        </div>

        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Submission ID
            </dt>
            <dd className="mt-1 font-mono text-sm text-zinc-900 dark:text-zinc-100">
              {id}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Session ID
            </dt>
            <dd className="mt-1 font-mono text-sm text-zinc-900 dark:text-zinc-100">
              {submission.sessionId}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Created
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {formatDate(submission.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Expires
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {formatDate(submission.expiresAt)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Artifact Path
            </dt>
            <dd className="mt-1 font-mono text-sm text-zinc-900 dark:text-zinc-100">
              {submission.artifactGcsPrefix}
            </dd>
          </div>
        </dl>

        {/* Download link */}
        <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <a
            href={`/api/submissions/${id}/download`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Artifact Bundle
          </a>
        </div>
      </div>

      {/* Inputs section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Inputs
        </h2>
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {isEmptyObject(submission.inputs) ? (
            <p className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
              No input data recorded.
            </p>
          ) : (
            <pre className="overflow-x-auto p-6 text-sm text-zinc-800 dark:text-zinc-200">
              {formatJson(submission.inputs)}
            </pre>
          )}
        </div>
      </div>

      {/* Extracted section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Extracted Data
        </h2>
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {isEmptyObject(submission.extracted) ? (
            <p className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
              No extracted data recorded.
            </p>
          ) : (
            <pre className="overflow-x-auto p-6 text-sm text-zinc-800 dark:text-zinc-200">
              {formatJson(submission.extracted)}
            </pre>
          )}
        </div>
      </div>

      {/* Outputs section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Outputs
        </h2>
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {isEmptyObject(submission.outputs) ? (
            <p className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
              No output data recorded.
            </p>
          ) : (
            <pre className="overflow-x-auto p-6 text-sm text-zinc-800 dark:text-zinc-200">
              {formatJson(submission.outputs)}
            </pre>
          )}
        </div>
      </div>

      {/* Citations section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Citations
        </h2>
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {!submission.citations || submission.citations.length === 0 ? (
            <p className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
              No citations recorded.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {submission.citations.map((citation, index) => (
                <li key={index} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {citation.title}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Source: {citation.sourceRef}
                      </p>
                      <p className="mt-1 font-mono text-xs text-zinc-400 dark:text-zinc-500">
                        Chunk ID: {citation.chunkId}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
