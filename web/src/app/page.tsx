import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="relative">
        <div className="flex flex-col items-center md:flex-row md:items-start md:gap-8">
          {/* Profile Photo */}
          <div className="mb-6 flex-shrink-0 md:mb-0">
            <Image
              src="/profile-photo.jpg"
              alt="Sam Kirk"
              width={192}
              height={256}
              className="w-40 md:w-48 rounded-lg border-4 border-blue-400/30 shadow-lg"
              priority
            />
          </div>

          {/* Text Content */}
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
              Sam Kirk
            </h1>
            <p className="mt-2 text-lg text-zinc-500 dark:text-zinc-400">
              Fremont, California
            </p>
            <p className="mt-4 text-xl leading-8 text-zinc-600 dark:text-zinc-400">
              Software engineer with expertise in AI/ML, full-stack development,
              and building products that solve real problems.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions for Hiring Managers */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Hiring Manager?
        </h2>
        <p className="mt-2 text-center text-zinc-600 dark:text-zinc-400">
          Use these AI-powered tools to quickly evaluate my fit for your role.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <Link
            href="/tools/fit"
            className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700"
          >
            <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-50 dark:group-hover:text-blue-400">
              How Do I Fit?
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Get a detailed fit analysis with scoring and rationale.
            </p>
          </Link>

          <Link
            href="/tools/resume"
            className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700"
          >
            <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-50 dark:group-hover:text-blue-400">
              Custom Resume
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Generate a tailored resume for your specific role.
            </p>
          </Link>

          <Link
            href="/tools/interview"
            className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700"
          >
            <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-50 dark:group-hover:text-blue-400">
              Interview Me
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Ask questions about my experience and background.
            </p>
          </Link>
        </div>
      </section>

      {/* Explore Section */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Explore More
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/explorations"
            className="rounded-full border border-zinc-200 px-6 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Explorations
          </Link>
          <Link
            href="/dance-menu"
            className="rounded-full border border-zinc-200 px-6 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Dance Menu
          </Link>
          <Link
            href="/song-dedication"
            className="rounded-full border border-zinc-200 px-6 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Song Dedication
          </Link>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="mt-16 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          Want to get in touch directly?{" "}
          <a
            href="mailto:sam@samkirk.com"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            sam@samkirk.com
          </a>
        </p>
      </section>
    </div>
  );
}
