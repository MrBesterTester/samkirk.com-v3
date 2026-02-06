export default function PhotoFunPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Photo Fun
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        An AI-powered photo editing application built with Google Gemini.
        Transform your photos into creative styles with preset options or custom
        prompts.
      </p>

      {/* Features Section */}
      <section className="mt-12">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Features
          </h2>
          <ul className="mt-4 space-y-3">
            <li className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600 dark:text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-zinc-700 dark:text-zinc-300">
                <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                  4 preset styles:
                </strong>{" "}
                Professional, Claymation, Cyberpunk, and Pencil Sketch
              </span>
            </li>
            <li className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600 dark:text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-zinc-700 dark:text-zinc-300">
                <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                  Custom prompts:
                </strong>{" "}
                Write your own transformation instructions for personalized
                results
              </span>
            </li>
            <li className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600 dark:text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-zinc-700 dark:text-zinc-300">
                <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                  Real-time image processing:
                </strong>{" "}
                Powered by Google Gemini for fast, high-quality transformations
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mt-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Try It Out
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Upload a photo and see the magic happen.
            </p>
            <a
              href="https://photo-fun.samkirk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
            >
              Launch Photo Fun
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
