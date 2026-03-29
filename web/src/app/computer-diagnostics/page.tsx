import Link from "next/link";

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

      {/* Why this matters */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-text-primary">
          Why This Project Matters
        </h2>
        <p className="mt-3 text-text-secondary">
          Every other project on this site demonstrates that I can{" "}
          <em>use</em> AI &mdash; calling APIs, wrapping AI services in web
          apps. Thousands of developers do this. This project demonstrates
          that I can <em>teach</em> AI. The foundation is the diagnostic
          discipline of Fault Isolation and Fault Identification &mdash; a
          methodology inherited from IBM&apos;s field service philosophy
          that systematically narrows a failure to its root cause. I
          generated 252 training examples grounded in these principles,
          fine-tuned a model using LoRA adapters on my M1 iMac, and
          published the results.
        </p>
        <p className="mt-3 text-text-secondary">
          I&apos;ve reinforced this diagnostic foundation using the
          physics-based interpretation of computing championed by{" "}
          <a
            href="https://compu-flair.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:text-accent-hover"
          >
            CompuFlair
          </a>
          , applying it at both the macro and micro levels of LLMs:
        </p>
        <ul className="mt-3 space-y-3 text-text-secondary">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
            <span>
              <strong className="text-text-primary">Macro level:</strong>{" "}
              the pre-trained model is treated as a thermodynamic system
              already annealed to a low-energy equilibrium &mdash; LoRA
              applies a small, targeted perturbation rather than melting the
              entire structure. (
              <a
                href="https://github.com/MrBesterTester/ml-training-m1#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent hover:text-accent-hover"
              >
                Project README
              </a>
              )
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
            <span>
              <strong className="text-text-primary">Micro level:</strong>{" "}
              each adapted layer&apos;s correction decomposes into
              independent modes ordered by energy, mirroring how physical
              systems decompose into fundamental harmonics. Only 8 dominant
              modes per layer are needed because domain specialization lies
              in a very low-dimensional subspace of parameter space. (
              <Link
                href="/computer-diagnostics/physics-of-lora"
                className="font-medium text-accent hover:text-accent-hover"
              >
                Physics of LoRA
              </Link>
              )
            </span>
          </li>
        </ul>
      </section>

      {/* What I built */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-text-primary">
          What I Built
        </h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-border">
              <tr>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-text-primary">
                  Model
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  Llama 3.2 3B, 4-bit quantized
                </td>
              </tr>
              <tr>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-text-primary">
                  Method
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  LoRA fine-tuning (rank 8)
                </td>
              </tr>
              <tr>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-text-primary">
                  Dataset
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  252 physics-grounded Q&amp;A pairs across 12 categories
                </td>
              </tr>
              <tr>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-text-primary">
                  Hardware
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  M1 iMac, 16 GB &mdash; no cloud GPU
                </td>
              </tr>
              <tr>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-text-primary">
                  Training time
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  ~47 minutes
                </td>
              </tr>
              <tr>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-text-primary">
                  Val loss improvement
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  2.809 &rarr; 2.037 (27.5% reduction)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Why it's a differentiator */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-text-primary">
          Why It&apos;s a Differentiator
        </h2>
        <ul className="mt-4 space-y-3 text-text-secondary">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
            <span>
              <strong className="text-text-primary">
                Bridges old and new career:
              </strong>{" "}
              feeds the diagnostic discipline of Fault Isolation and Fault
              Identification into modern AI &mdash; not abandoning the old,
              amplifying it
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
            <span>
              <strong className="text-text-primary">
                Consumer hardware:
              </strong>{" "}
              proves useful AI doesn&apos;t require massive infrastructure
              &mdash; directly relevant to consulting clients
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
            <span>
              <strong className="text-text-primary">
                Dramatic results:
              </strong>{" "}
              the base model thought boundary scan meant &ldquo;scanning
              edges of the board&rdquo;; the fine-tuned model correctly
              explains TAP controllers and JTAG chains
            </span>
          </li>
        </ul>
      </section>

      {/* Project evolution */}
      <section className="mt-12 rounded-lg border border-accent/30 bg-accent/5 p-6">
        <h2 className="text-lg font-semibold text-text-primary">
          Project Evolution
        </h2>
        <ul className="mt-3 space-y-3 text-text-secondary">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
            <span>
              <strong className="text-text-primary">v1 (basic) &mdash; Knowledge base:</strong>{" "}
              252 conceptual Q&amp;A pairs covering hardware diagnostics
              fundamentals &mdash; the model can explain boundary scan,
              JTAG chains, mixed-signal fault isolation, and more.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
            <span>
              <strong className="text-text-primary">v2 (current) &mdash; Working diagnostician:</strong>{" "}
              added 133 Fault Detection / Fault Isolation scenario entries
              presenting specific measurements, traces, and logs that
              require anomaly detection and root-cause analysis.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
            <span>
              <strong className="text-text-primary">v3 (next) &mdash; Explicit reasoning:</strong>{" "}
              the model now classifies each problem into a diagnostic mode
              (FD, FI, FD+FI, or Triage) as its opening step, surfacing
              its reasoning process for validation &mdash; transforming it
              from an answer generator into a reasoning partner.
            </span>
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
              href="https://github.com/MrBesterTester/ml-training-m1"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:text-accent-hover"
            >
              GitHub repo &rarr;
            </a>
            <p className="mt-1 text-sm text-text-muted">
              Full source code, training scripts, dataset, and project
              README with the macro-level physics framing.
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
              Data science coaching and consulting by Ardavan Borzou, PhD
              &mdash; physics-based interpretation of computing that
              informs the macro/micro framing used in this project.
            </p>
          </li>
        </ul>
      </section>
    </div>
  );
}
