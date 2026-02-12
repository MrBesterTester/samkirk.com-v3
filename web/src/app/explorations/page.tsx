import Link from "next/link";

interface Exploration {
  href: string;
  title: string;
  description: string;
  external?: boolean;
}

const explorations: Exploration[] = [
  {
    href: "/explorations/category-theory",
    title: "Category Theory",
    description:
      "Examples of Category Theory using common, everyday (non-mathematical) objects.",
  },
  {
    href: "https://mrbestertester.github.io/pf-understand/",
    title: "Pocket Flow",
    description: "Tutorials using Pocket Flow for understanding Crawl4Ai, Modular's Max, and two different tutorials on the Mojo programming language. Hosted as a GitHub Pages website.",
    external: true,
  },
  {
    href: "/explorations/dance-instruction",
    title: "Dance Instruction",
    description: "Thoughts and resources on teaching and learning dance.",
  },
  {
    href: "/explorations/uber-level-ai-skills",
    title: "Uber Level AI Skills",
    description: "Advanced techniques for getting the most out of AI tools. Taken from Nate B. Jones.",
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
        {explorations.map((exploration) => {
          const className = "group rounded-xl border border-border bg-primary p-6 shadow-sm transition-all hover:border-accent hover:shadow-md";
          const content = (
            <>
              <h2 className="text-xl font-semibold text-text-primary group-hover:text-accent">
                {exploration.title}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {exploration.description}
              </p>
            </>
          );
          return exploration.external ? (
            <a
              key={exploration.href}
              href={exploration.href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
              {content}
            </a>
          ) : (
            <Link
              key={exploration.href}
              href={exploration.href}
              className={className}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
