import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            &copy; {currentYear} Sam Kirk. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="mailto:sam@samkirk.com"
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              sam@samkirk.com
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
