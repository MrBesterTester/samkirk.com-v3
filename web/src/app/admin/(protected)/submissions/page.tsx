import Link from "next/link";
import { listSubmissions } from "@/lib/submission";
import type { SubmissionTool, SubmissionStatus } from "@/lib/firestore";

// Revalidate every 30 seconds to keep the list fresh
export const revalidate = 30;

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
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimeAgo(timestamp: { toDate(): Date }): string {
  const date = timestamp.toDate();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(timestamp);
}

export default async function AdminSubmissionsPage() {
  const submissions = await listSubmissions({ limit: 50 });

  const stats = {
    total: submissions.length,
    fit: submissions.filter((s) => s.doc.tool === "fit").length,
    resume: submissions.filter((s) => s.doc.tool === "resume").length,
    interview: submissions.filter((s) => s.doc.tool === "interview").length,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Recent Submissions
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            View recent tool submissions and their outputs.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Admin
        </Link>
      </div>

      {/* Stats cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Total
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {stats.total}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
            Fit Analysis
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {stats.fit}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Resumes
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {stats.resume}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            Interviews
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {stats.interview}
          </p>
        </div>
      </div>

      {/* Submissions list */}
      {submissions.length === 0 ? (
        <div className="mt-12 rounded-xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-center text-zinc-500 dark:text-zinc-400">
            No submissions yet. Submissions will appear here when visitors use
            the AI tools.
          </p>
        </div>
      ) : (
        <div className="mt-8">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                  >
                    Tool
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                  >
                    Created
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                  >
                    Expires
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {submissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getToolColor(submission.doc.tool)}`}
                      >
                        {getToolLabel(submission.doc.tool)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(submission.doc.status)}`}
                      >
                        {getStatusLabel(submission.doc.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      <span title={formatDate(submission.doc.createdAt)}>
                        {formatTimeAgo(submission.doc.createdAt)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {formatDate(submission.doc.expiresAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/admin/submissions/${submission.id}`}
                        className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info section */}
      <div className="mt-12 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          About Submissions
        </h2>
        <ul className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <li className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Submissions are automatically deleted after 90 days per the
              retention policy.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Click on any submission to view its full details, inputs, outputs,
              and artifacts.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              This page shows the most recent 50 submissions across all tools.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
