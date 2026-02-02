import Link from "next/link";

const tools = [
  {
    href: "/tools/fit",
    title: "How Do I Fit?",
    description:
      "Submit a job opportunity and get a detailed fit analysis with scoring and rationale.",
  },
  {
    href: "/tools/resume",
    title: "Get a Custom Resume",
    description:
      "Generate a tailored 2-page resume optimized for a specific job posting.",
  },
  {
    href: "/tools/interview",
    title: "Interview Me Now",
    description:
      "Have an interactive Q&A conversation about Sam's career and experience.",
  },
];

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        AI Tools
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        These tools help hiring managers quickly evaluate whether Sam Kirk is a
        good fit for their role.
      </p>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <h2 className="text-xl font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-50 dark:group-hover:text-blue-400">
              {tool.title}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
