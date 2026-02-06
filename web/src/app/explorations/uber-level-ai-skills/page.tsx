import { StaticHtmlViewer } from "@/components";

export default function UberLevelAiSkillsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">
        Uber Level AI Skills
      </h1>
      <p className="mt-4 text-lg text-text-secondary">
        Advanced techniques for getting the most out of AI tools. Learn
        strategies for effective context management, iterative refinement,
        verification, and workflow design that separate casual AI usage from
        genuinely productive collaboration.
      </p>

      <div className="mt-12">
        <StaticHtmlViewer
          src="uber-level-ai-skills.html"
          title="Uber Level AI Skills content"
          minHeight={700}
        />
      </div>
    </div>
  );
}
