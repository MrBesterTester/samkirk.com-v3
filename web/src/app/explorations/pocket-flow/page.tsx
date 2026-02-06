import { StaticHtmlViewer } from "@/components";

export default function PocketFlowPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">
        Pocket Flow
      </h1>
      <p className="mt-4 text-lg text-text-secondary">
        A lightweight framework for building AI workflows. Pocket Flow
        emphasizes simplicity and composability, providing a minimal set of
        primitives for chaining LLM calls, managing context, and orchestrating
        multi-step AI pipelines without heavy dependencies.
      </p>

      <div className="mt-12">
        <StaticHtmlViewer
          src="pocket-flow.html"
          title="Pocket Flow content"
          minHeight={600}
        />
      </div>
    </div>
  );
}
