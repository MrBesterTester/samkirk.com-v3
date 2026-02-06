import Link from "next/link";

const explorations = [
  {
    href: "/explorations/category-theory",
    title: "Category Theory",
    description:
      "Exploring the mathematical foundations of abstraction and composition.",
  },
  {
    href: "/explorations/pocket-flow",
    title: "Pocket Flow",
    description: "A lightweight framework for building AI workflows.",
  },
  {
    href: "/explorations/dance-instruction",
    title: "Dance Instruction",
    description: "Thoughts and resources on teaching and learning dance.",
  },
  {
    href: "/explorations/uber-level-ai-skills",
    title: "Uber Level AI Skills",
    description: "Advanced techniques for getting the most out of AI tools.",
  },
  {
    href: "/explorations/tensor-logic",
    title: "Tensor Logic",
    description:
      "Educational interactive demo illustrating a unified programming paradigm bridging neural and symbolic AI.",
  },
];

export default function ExplorationsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Explorations
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        A collection of topics and ideas I&apos;ve been exploring.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {explorations.map((exploration) => (
          <Link
            key={exploration.href}
            href={exploration.href}
            className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <h2 className="text-xl font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-50 dark:group-hover:text-blue-400">
              {exploration.title}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {exploration.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
