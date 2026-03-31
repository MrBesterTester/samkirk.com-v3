import Link from "next/link";
import { StaticHtmlViewer } from "@/components";

export default function ComputerDiagnosticsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">
        Computer Diagnostics via LLM Fine-Tuning
      </h1>
      <p className="mt-4 text-lg text-text-secondary">
        I taught an LLM my craft &mdash; the principles of Fault Isolation
        and Fault Identification inherited from IBM&apos;s field service
        philosophy, distilled into a fine-tuned model that runs on consumer
        hardware.
      </p>

      <div className="mt-12">
        <StaticHtmlViewer
          src="computer-diagnostics-feature.html"
          title="Hardware Diagnostics LLM Fine-Tuning — Project Feature"
          minHeight={800}
        />
      </div>

      {/* Old Sam → New Sam */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-text-primary">
          Old Sam Kirk, Meet New Sam Kirk
        </h2>
        <p className="mt-3 text-text-secondary">
          For four decades I wrote automated test and diagnostic programs for
          hardware in Silicon Valley &mdash; board-level in-circuit test,
          boundary scan, system-level power-on self-test, mixed-signal
          functional test. That was Old Sam Kirk.
        </p>
        <p className="mt-3 text-text-secondary">
          New Sam Kirk took that same diagnostic expertise and fed it into a
          modern language model. The training data isn&apos;t scraped from the
          web &mdash; it&apos;s distilled from real field experience with
          fault isolation and fault identification, grounded in the physics of
          how hardware actually fails. The result: a fine-tuned model that
          thinks the way a physicist-engineer does, not the way a chatbot
          guesses.
        </p>
        <p className="mt-3 text-text-secondary">
          This project is the bridge. It proves that decades of domain
          expertise aren&apos;t made obsolete by AI &mdash; they&apos;re made
          more valuable, because only someone who lived the work can teach a
          model to reason about it correctly.
        </p>
      </section>

      {/* Further work */}
      <section className="mt-12 rounded-lg border border-accent/30 bg-accent/5 p-6">
        <h2 className="text-lg font-semibold text-text-primary">
          Further Work
        </h2>
        <p className="mt-2 text-text-secondary">
          The results above are from <strong>v1</strong> &mdash; the first
          fine-tuned model, trained on 252 conceptual Q&amp;A pairs. Two
          further iterations are planned:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-text-secondary">
          <li>
            <strong className="text-text-primary">v2:</strong> expand the
            training dataset with 133 Fault Detection / Fault Isolation
            diagnostic scenarios presenting real measurement data, traces,
            and logs &mdash; moving the model from knowledgeable explainer
            to working diagnostician. The dataset is ready; training is
            next.
          </li>
          <li>
            <strong className="text-text-primary">v3:</strong> add explicit
            diagnostic mode classification (FD, FI, FD+FI, or Triage) as
            the model&apos;s opening reasoning step &mdash; surfacing its
            diagnostic logic for validation.
          </li>
        </ul>
      </section>

      {/* References */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-text-primary">
          References
        </h2>
        <ul className="mt-4 space-y-4 text-text-secondary">
          <li>
            <Link
              href="/computer-diagnostics/physics-of-lora"
              className="font-medium text-accent hover:text-accent-hover"
            >
              The Physics of LoRA &rarr;
            </Link>
            <p className="mt-1 text-sm text-text-muted">
              Unified physics interpretation of LoRA fine-tuning &mdash;
              thermodynamic perturbation theory (macro) and normal-mode
              decomposition (micro), with KaTeX equations and SVG diagrams.
              {" "}
              <a
                href="https://github.com/MrBesterTester/ml-training-m1/blob/main/Compu-Flair/Physics_of_LoRA.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent-hover"
              >
                Source in repo
              </a>
            </p>
          </li>
          <li>
            <a
              href="https://compu-flair.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:text-accent-hover"
            >
              CompuFlair &rarr;
            </a>
            <p className="mt-1 text-sm text-text-muted">
              Physics-based interpretation of computing by Ardavan Borzou,
              PhD &mdash; the framework behind the macro/micro framing in
              this project.
            </p>
          </li>
          <li>
            <a
              href="https://github.com/MrBesterTester/ml-training-m1"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:text-accent-hover"
            >
              GitHub repo &rarr;
            </a>
            <p className="mt-1 text-sm text-text-muted">
              Full source code, training scripts, dataset, and project
              README.
            </p>
          </li>
          <li>
            <a
              href="https://huggingface.co/MrBesterTester/hw-diagnostics-advisor-llama3.2-3b-lora"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:text-accent-hover"
            >
              HuggingFace adapter weights &rarr;
            </a>
            <p className="mt-1 text-sm text-text-muted">
              Published LoRA adapter weights for the hardware diagnostics
              fine-tuned Llama 3.2 3B model.
            </p>
          </li>
        </ul>
      </section>
    </div>
  );
}
