export default function SongDedicationPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Song Dedication
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        A special dedication through music.
      </p>

      <div className="mt-12 rounded-xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-center text-zinc-500 dark:text-zinc-400">
          Song lyrics and audio will be displayed here.
        </p>
      </div>
    </div>
  );
}
