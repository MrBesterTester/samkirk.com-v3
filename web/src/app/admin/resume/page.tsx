export default function AdminResumePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Resume Management
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        Upload and manage the master resume markdown file.
      </p>

      <div className="mt-12 rounded-xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-center text-zinc-500 dark:text-zinc-400">
          Resume upload functionality will be implemented here. Upload a
          markdown file to update the master resume used by all AI tools.
        </p>
      </div>
    </div>
  );
}
