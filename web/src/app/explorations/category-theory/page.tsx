import { StaticHtmlViewer } from "@/components";

export default function CategoryTheoryPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Category Theory
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        Exploring the mathematical foundations of abstraction and composition.
        Category theory provides a unifying language for understanding structure
        across mathematics, programming, and logic&mdash;from functors and
        monads to the deep patterns underlying software architecture.
      </p>

      <div className="mt-12">
        <StaticHtmlViewer
          src="category-theory.html"
          title="Category Theory content"
          minHeight={600}
        />
      </div>
    </div>
  );
}
