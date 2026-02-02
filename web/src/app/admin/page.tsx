import Link from "next/link";

const adminLinks = [
  {
    href: "/admin/resume",
    title: "Resume Management",
    description: "Upload and manage the master resume used by AI tools.",
  },
  {
    href: "/admin/dance-menu",
    title: "Dance Menu",
    description: "Upload and publish the weekly dance menu.",
  },
  {
    href: "/admin/submissions",
    title: "Recent Submissions",
    description: "View recent tool submissions and their outputs.",
  },
];

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Admin Dashboard
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        Manage site content and view tool activity.
      </p>

      <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Note: This area is protected and requires authentication. Sign in
          with an authorized Google account to access these features.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <h2 className="text-xl font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-50 dark:group-hover:text-blue-400">
              {link.title}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {link.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
