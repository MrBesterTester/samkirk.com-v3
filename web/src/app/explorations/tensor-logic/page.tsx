export default function TensorLogicPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">
        Tensor Logic
      </h1>
      <p className="mt-4 text-lg text-text-secondary">
        An educational interactive demo illustrating Pedro Domingos&apos; Tensor
        Logic&mdash;a unified programming paradigm bridging neural and symbolic
        AI.
      </p>

      {/* Features Section */}
      <section className="mt-12">
        <div className="rounded-xl border border-border bg-primary p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-text-primary">
            Features
          </h2>
          <ul className="mt-4 space-y-3">
            <li className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-text-secondary">
                <strong className="font-medium text-text-primary">
                  8 interactive examples:
                </strong>{" "}
                Spanning 5 AI paradigms&mdash;Bayesian, Logical, Instance,
                Neurosymbolic, and Neural
              </span>
            </li>
            <li className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-text-secondary">
                <strong className="font-medium text-text-primary">
                  Mathematical unification:
                </strong>{" "}
                Demonstrates how Einstein summation connects diverse AI
                approaches under one framework
              </span>
            </li>
            <li className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-text-secondary">
                <strong className="font-medium text-text-primary">
                  Peer-reviewed research:
                </strong>{" "}
                Based on published academic work exploring the foundations of
                unified AI
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Reference Section */}
      <section className="mt-8">
        <div className="rounded-xl border border-border bg-primary p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-text-primary">
            Reference
          </h2>
          <p className="mt-3 text-text-secondary">
            Based on the paper by Pedro Domingos:{" "}
            <a
              href="https://arxiv.org/abs/2510.12269"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent underline decoration-accent/30 transition-colors hover:text-accent-hover"
            >
              arXiv:2510.12269
            </a>
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mt-8">
        <div className="rounded-xl border border-border bg-primary p-8 shadow-sm">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-text-primary">
              Try It Out
            </h2>
            <p className="mt-2 text-text-secondary">
              Explore the interactive demo and see how tensor logic unifies AI
              paradigms.
            </p>
            <a
              href="https://tensor-logic.samkirk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Launch Tensor Logic
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
