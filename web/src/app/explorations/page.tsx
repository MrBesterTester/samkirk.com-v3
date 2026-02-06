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
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">
        Explorations
      </h1>
      <p className="mt-4 text-lg text-text-secondary">
        A collection of topics and ideas I&apos;ve been exploring.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {explorations.map((exploration) => (
          <Link
            key={exploration.href}
            href={exploration.href}
            className="group rounded-xl border border-border bg-primary p-6 shadow-sm transition-all hover:border-accent hover:shadow-md"
          >
            <h2 className="text-xl font-semibold text-text-primary group-hover:text-accent">
              {exploration.title}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {exploration.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
