import { StaticHtmlViewer } from "@/components";

export default function CategoryTheoryPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">
        Category Theory
      </h1>
      <p className="mt-4 text-lg text-text-secondary">
        Examples of Category Theory using common, everyday (non-mathematical) objects.
      </p>

      <div className="mt-6">
        <a
          href="/static/category-theory.html"
          download="category-theory.html"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-primary px-4 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-accent hover:bg-secondary"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download HTML
        </a>
      </div>

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
