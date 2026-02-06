import { StaticHtmlViewer } from "@/components";

export default function DanceInstructionPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Dance Instruction
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        Thoughts and resources on teaching and learning dance. From
        philosophy of instruction to practical learning principles, this
        exploration covers the challenges and joys of communicating movement
        through words, demonstration, and shared experience.
      </p>

      <div className="mt-12">
        <StaticHtmlViewer
          src="dance-instruction.html"
          title="Dance Instruction content"
          minHeight={600}
        />
      </div>
    </div>
  );
}
