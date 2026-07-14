import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, OG_IMAGE } from "@/lib/seo";

const DESCRIPTION =
  "Machine learning work by Sam Kirk — a LoRA fine-tuned Llama 3.2 3B for hardware diagnostics, and six neural architectures with a law of physics built into the wiring. Trained and evaluated on an M1 iMac, with pre-registered acceptance criteria.";

export const metadata: Metadata = {
  title: "Machine Learning — Sam Kirk",
  description: DESCRIPTION,
  openGraph: {
    title: "Machine Learning — Sam Kirk",
    description: DESCRIPTION,
    url: `${SITE_URL}/machine-learning`,
    type: "website",
    images: [{ url: OG_IMAGE, alt: "Sam Kirk" }],
  },
  alternates: {
    canonical: `${SITE_URL}/machine-learning`,
  },
};

interface Project {
  href: string;
  title: string;
  description: string;
  external?: boolean;
}

const projects: Project[] = [
  {
    href: "/computer-diagnostics",
    title: "Computer Diagnostics via LoRA Fine-Tuning",
    description:
      "LoRA (Low-Rank Adaptation) fine-tuned Llama 3.2 3B on 252 physics-grounded Q&A pairs rooted in Fault Isolation and Fault Identification. Validation loss reduced 27.5% on consumer hardware, no cloud GPU (graphics processing unit). I taught an LLM (large language model) my craft.",
  },
  {
    href: "https://github.com/MrBesterTester/physics-first-zoo",
    title: "Physics-First Zoo — six architectures, six laws",
    description:
      "Hamiltonian dynamics, C4 rotation symmetry, a Boltzmann sampler, port-Hamiltonian passivity, a physics-informed network, and one energy core that reproduces three textbook models exactly. Each built in MLX on an M1 iMac against criteria fixed before the code was written.",
    external: true,
  },
  {
    href: "https://github.com/MrBesterTester/physics-first-zoo/tree/main/smolvla-arm",
    title: "SmolVLA — a 450M robot policy on a Mac",
    description:
      "A released VLA (vision-language-action) model run inference-only on Apple MPS (Metal Performance Shaders). Not trained here — this is inference and evaluation engineering, and its grounding criterion is flagged REVISE and left flagged.",
    external: true,
  },
  {
    href: "/robotics",
    title: "A learned robot controller",
    description:
      "CritterRitter Robot B carries a 16-unit MLP (multi-layer perceptron) with hand-written backprop, trained by imitating a model-based teacher robot. The full teacher/student story lives on the Robotics page.",
  },
];

export default function MachineLearningPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">
        Machine Learning
      </h1>
      <p className="mt-4 text-lg text-text-secondary">
        Models I built, trained, and measured — mostly on a 16 GB M1 iMac, without a cloud GPU
        (graphics processing unit).
      </p>

      <div className="mt-8 rounded-lg border border-accent/30 bg-accent/5 p-6">
        <h2 className="text-lg font-semibold text-text-primary">
          Every claim here was pre-registered
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Each project in the physics-first zoo was built to a written contract, frozen before the
          first line of code, with its acceptance criteria fixed <em>in advance</em> — not chosen
          after seeing the results. Each one also had to beat a parameter-matched, physics-free
          baseline: same parameter budget, same data, no physics. The code, the saved parameters,
          and the tests that check the criteria all ship, so the numbers can be re-run rather than
          taken on trust.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {projects.map((project) => {
          const className =
            "group rounded-xl border border-border bg-primary p-6 shadow-sm transition-all hover:border-accent hover:shadow-md";
          const content = (
            <>
              <h2 className="text-xl font-semibold text-text-primary group-hover:text-accent">
                {project.title}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">{project.description}</p>
            </>
          );
          return project.external ? (
            <a
              key={project.href}
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
              {content}
            </a>
          ) : (
            <Link key={project.href} href={project.href} className={className}>
              {content}
            </Link>
          );
        })}
      </div>

      <h2 className="mt-16 text-2xl font-bold tracking-tight text-text-primary">
        A result worth stating plainly
      </h2>
      <p className="mt-4 text-text-secondary">
        A conventional network learns a physical law approximately, from data, and drifts off it.
        Wire the law into the architecture instead and the model <em>cannot</em> violate it — not
        because training discouraged it, but because the wiring makes it unrepresentable. The
        Hamiltonian network holds energy to <strong>0.043% drift</strong> over a 1000-step rollout,{" "}
        <strong>1148× better</strong> than a parameter-matched network with the same budget and the
        same data. The equivariant network&apos;s rotation invariance is exact to machine precision.
      </p>
      <p className="mt-4 text-text-secondary">
        Two of the eight entries are deliberate controls rather than achievements, and they are
        labelled that way in the repository. One puts the same physics in the loss instead of the
        wiring — and its residual stays strictly above zero, which is the measured difference
        between <em>penalized</em> and <em>guaranteed</em>. The other has no neural network at all
        and computes the answer from known equations, which is the ceiling any learned controller is
        trying to reach. Without them, &ldquo;physics-first&rdquo; is a claim. With them, it is a
        comparison.
      </p>

      <div className="mt-10">
        <a
          href="https://github.com/MrBesterTester/physics-first-zoo"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-accent hover:text-accent-hover"
        >
          View the physics-first zoo on GitHub &rarr;
        </a>
      </div>
    </div>
  );
}
