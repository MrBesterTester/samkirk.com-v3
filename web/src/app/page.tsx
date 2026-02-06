import Image from "next/image";
import Link from "next/link";
import { ToolPreview } from "@/components";

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
          <ToolPreview
            title="How Do I Fit?"
            description="Get a detailed fit analysis with scoring and rationale."
            ctaText="Analyze Fit"
            ctaLink="/tools/fit"
          />
          <ToolPreview
            title="Custom Resume"
            description="Generate a tailored resume for your specific role."
            ctaText="Generate Resume"
            ctaLink="/tools/resume"
          />
          <ToolPreview
            title="Interview Me"
            description="Ask questions about my experience and background."
            ctaText="Start Interview"
            ctaLink="/tools/interview"
            previewContent={
              <div className="space-y-2 text-sm">
                <p className="font-medium text-zinc-700 dark:text-zinc-300">
                  Q: What&apos;s your experience with AI?
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  A: I&apos;ve built LLM-powered tools including this site&apos;s
                  interview and fit-analysis features using Vertex AI and
                  prompt engineering.
                </p>
              </div>
            }
          />
        </div>
      </section>

      {/* Dance Menu Teaser */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          This Week&apos;s Dance Menu
        </h2>
        <p className="mt-2 text-center text-zinc-600 dark:text-zinc-400">
          Curated social dance playlists, updated weekly.
        </p>

        <div className="mt-8 flex justify-center">
          <ToolPreview
            title="Dance Menu"
            description="Browse this week's curated playlist for social dancing — salsa, bachata, kizomba, and more."
            ctaText="View Full Menu"
            ctaLink="/dance-menu"
          />
        </div>
      </section>

      {/* Photo Fun */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Photo Fun
        </h2>
        <p className="mt-2 text-center text-zinc-600 dark:text-zinc-400">
          AI-powered photo editing using Google Gemini.
        </p>

        <div className="mt-8 flex justify-center">
          <div className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700">
            <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-50 dark:group-hover:text-blue-400">
              Photo Fun
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              AI-powered photo editing using Google Gemini. Transform your photos
              with artistic styles like Professional, Claymation, Cyberpunk, and
              Pencil Sketch.
            </p>
            <a
              href="https://photo-fun.samkirk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-medium text-accent hover:text-accent-hover transition-colors"
            >
              Try Photo Fun &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Song Dedication */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Song Dedication
        </h2>
        <p className="mt-2 text-center text-zinc-600 dark:text-zinc-400">
          A special dedication through music.
        </p>

        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* About */}
          <p className="text-zinc-600 dark:text-zinc-400">
            This song holds a special meaning. The story behind this dedication
            will be shared here.
          </p>

          {/* Audio Player */}
          <div className="mt-6">
            <div className="flex items-center justify-center rounded-lg bg-zinc-100 py-8 dark:bg-zinc-800">
              <div className="text-center">
                <svg
                  className="mx-auto h-10 w-10 text-zinc-400 dark:text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
                  />
                </svg>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Audio player will be embedded here
                </p>
              </div>
            </div>
            <p className="mt-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Or listen on{" "}
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Spotify
              </a>{" "}
              /{" "}
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                YouTube
              </a>
            </p>
          </div>

          {/* Lyrics */}
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Lyrics
            </h3>

            {/* Verse 1 */}
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Verse 1
              </p>
              <p className="whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">
                Song lyrics will appear here.
                {"\n"}Each line of the verse
                {"\n"}will be displayed
                {"\n"}with proper formatting.
              </p>
            </div>

            {/* Chorus */}
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Chorus
              </p>
              <p className="whitespace-pre-line text-sm font-medium text-zinc-800 dark:text-zinc-200">
                The chorus will stand out
                {"\n"}with a subtle background
                {"\n"}to differentiate it from verses.
              </p>
            </div>

            {/* Verse 2 */}
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Verse 2
              </p>
              <p className="whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">
                Additional verses
                {"\n"}follow the same pattern
                {"\n"}maintaining consistency.
              </p>
            </div>
          </div>

          {/* Song Info */}
          <div className="mt-6 border-t border-zinc-100 pt-4 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <p>
              <span className="font-medium">Song Title</span> by{" "}
              <span className="font-medium">Artist Name</span>
            </p>
            <p className="mt-1">Album Name &bull; Year</p>
          </div>

          {/* Link to full page */}
          <div className="mt-4 text-center">
            <Link
              href="/song-dedication"
              className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View full dedication page &rarr;
            </Link>
          </div>
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
