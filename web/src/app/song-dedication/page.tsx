export default function SongDedicationPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Song Dedication
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        A special dedication through music.
      </p>

      {/* About Section */}
      <section className="mt-12">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            About This Dedication
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            {/* Placeholder for dedication context/story */}
            This song holds a special meaning. The story behind this dedication
            will be shared here.
          </p>
        </div>
      </section>

      {/* Audio Section */}
      <section className="mt-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Listen
          </h2>
          <div className="mt-4">
            {/* Placeholder for audio embed (Spotify, YouTube, SoundCloud, etc.) */}
            <div className="flex items-center justify-center rounded-lg bg-zinc-100 py-12 dark:bg-zinc-800">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500"
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
            {/* Alternative: External link to song */}
            <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
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
        </div>
      </section>

      {/* Lyrics Section */}
      <section className="mt-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Lyrics
          </h2>
          <div className="mt-4 space-y-6">
            {/* Verse 1 */}
            <div className="lyrics-verse">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Verse 1
              </p>
              <p className="whitespace-pre-line text-zinc-700 dark:text-zinc-300">
                {/* Placeholder lyrics - replace with actual lyrics */}
                Song lyrics will appear here.
                {"\n"}Each line of the verse
                {"\n"}will be displayed
                {"\n"}with proper formatting.
              </p>
            </div>

            {/* Chorus */}
            <div className="lyrics-chorus rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Chorus
              </p>
              <p className="whitespace-pre-line font-medium text-zinc-800 dark:text-zinc-200">
                {/* Placeholder chorus - replace with actual lyrics */}
                The chorus will stand out
                {"\n"}with a subtle background
                {"\n"}to differentiate it from verses.
              </p>
            </div>

            {/* Verse 2 */}
            <div className="lyrics-verse">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Verse 2
              </p>
              <p className="whitespace-pre-line text-zinc-700 dark:text-zinc-300">
                {/* Placeholder lyrics - replace with actual lyrics */}
                Additional verses
                {"\n"}follow the same pattern
                {"\n"}maintaining consistency.
              </p>
            </div>

            {/* Additional sections can be added following the same pattern */}
          </div>
        </div>
      </section>

      {/* Song Info Footer */}
      <footer className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        <p>
          <span className="font-medium">Song Title</span> by{" "}
          <span className="font-medium">Artist Name</span>
        </p>
        <p className="mt-1">Album Name &bull; Year</p>
      </footer>
    </div>
  );
}
