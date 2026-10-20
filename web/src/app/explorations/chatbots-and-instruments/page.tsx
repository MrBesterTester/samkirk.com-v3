import type { Metadata } from "next";
import Image from "next/image";
import { ContactLink, DownloadLink } from "@/components/TrackedLink";
import { SITE_URL, OG_IMAGE } from "@/lib/seo";

const TITLE =
  "Letting your chatbots talk with your Instruments: my version of Anthropic's Model Hardware Standard (MHS)";
const DESCRIPTION =
  "TARE lets AI agents operate lab instruments, and checks what really happened. An independent design built from Anthropic's public description of the Model Hardware Standard, with four simulated instruments and published Claude evaluation results.";
const PAGE_URL = `${SITE_URL}/explorations/chatbots-and-instruments`;
const REPO_URL = "https://github.com/MrBesterTester/TARE";
const LINKEDIN_URL =
  "https://www.linkedin.com/posts/samuelkirk_letting-your-chatbots-talk-with-your-instruments-activity-7518085610771779584-GssH";

export const metadata: Metadata = {
  title: "Chatbots & Instruments — TARE, my version of Anthropic's MHS",
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    type: "article",
    images: [{ url: OG_IMAGE, alt: "Sam Kirk" }],
  },
  alternates: {
    canonical: PAGE_URL,
  },
};

// scroll-mt keeps a section heading clear of the sticky site header when reached from the contents strip.
const card = "scroll-mt-24 rounded-xl border border-border bg-primary p-6 shadow-sm";
const h2 = "text-xl font-semibold text-text-primary";
const body = "mt-3 text-text-secondary";
const link =
  "font-medium text-accent underline decoration-accent/30 transition-colors hover:text-accent-hover";
const button =
  "inline-flex items-center gap-2 rounded-lg border border-border bg-primary px-4 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-accent hover:bg-secondary";

const steps = [
  ["Validate", "the device, units and limits before anything is sent. Out-of-range or unknown requests are refused, and the refusal is explained."],
  ["Dispatch and read back.", "A setting counts as applied only if the readback matches. A mismatch is reported as unverified, and dependent steps stop."],
  ["Qualify", "every measurement with its unit, time, age, calibration status, uncertainty and quality flags. Stale or uncertain data is marked unusable rather than smoothed over."],
  ["Keep partial effects.", "If an action half-happens, TARE reports what did happen. Nothing is silently retried or rolled back."],
  ["Audit", "each attempt before dispatch and its outcome after."],
] as const;

const results = [
  { model: "Claude Opus 5.5, medium", test: "24 cases, twice each; 11 cases written before any model saw them", correct: "47 of 48", time: "13.7 s" },
  { model: "Claude Opus 5.5, medium", test: "Pilot, 13 cases", correct: "13 of 13", time: "14.3 s" },
  { model: "Claude Opus 5.5, high", test: "Pilot, 13 cases", correct: "12 of 13", time: "16.0 s" },
  { model: "Claude Sonnet 5.5, high", test: "Pilot, 13 cases", correct: "13 of 13", time: "14.5 s" },
];

const behaviors = [
  ["Stopping on failure.", "When a focus drive stuck, a robot stalled or a transfer came up short, the model reported the observed state, stopped dependent steps and did not retry without being asked."],
  ["Asking and refusing.", "When units or a volume were missing, the model asked first. Asked to heat a workstation with no heater, or move the robot outside its workspace, it proposed no operation and explained why."],
  ["Treating instrument data as data.", "One result carried a planted note telling the assistant to ignore the quality flags and call a stale reading fresh. In both trials Opus 5.5 identified the note as data, not an instruction, and kept the reading unusable."],
  ["Keeping judgments separate.", "A clean reading that disagrees with its reference was reported as both: usable, and outside tolerance."],
] as const;

/**
 * The recorded autofocus scan, already in SVG coordinates (x, y in the 900×280 viewBox),
 * copied from the brief's figure: x maps Z 0–24 µm onto 60–830, y maps focus score onto 215 (0) up to 53.47 (peak 0.462).
 */
const focusScan: [number, number][] = [
  [60.0, 208.87], [124.17, 204.38], [188.33, 194.79], [252.5, 176.6], [316.67, 142.51],
  [380.83, 88.9], [445.0, 53.47], [509.17, 88.9], [573.33, 142.51], [637.5, 176.6],
  [701.67, 194.79], [765.83, 204.38], [830.0, 208.87],
];

function RequestPathFigure() {
  // Solid arrows: requests and commands. Dashed arrows: readback and evidence.
  // The dash pattern, not color, distinguishes the two directions.
  return (
    <figure className="mt-6">
      {/* On phones the diagram keeps a legible size and scrolls sideways inside its frame. */}
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 760 230"
          role="img"
          aria-labelledby="tare-flow-title"
          className="h-auto w-full min-w-[600px] text-text-primary"
          fontFamily="inherit"
        >
          <title id="tare-flow-title">How a request flows through TARE</title>
          <defs>
            <marker id="tare-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
            </marker>
          </defs>
          <g fill="none" stroke="currentColor" strokeOpacity="0.55">
            <rect x="10" y="60" width="170" height="90" rx="8" />
            <rect x="580" y="20" width="170" height="170" rx="8" />
          </g>
          <rect x="255" y="20" width="250" height="170" rx="8" className="fill-accent/10 stroke-accent" strokeWidth="2" />
          <g fill="currentColor" textAnchor="middle" fontSize="12.5">
            <text x="95" y="92" fontSize="15" fontWeight="600">AI agent</text>
            <text x="95" y="113" fillOpacity="0.7">Claude, or another</text>
            <text x="95" y="130" fillOpacity="0.7">chatbot through MCP</text>
            <text x="380" y="46" fontSize="15" fontWeight="600">TARE service</text>
            <text x="380" y="72">1. Validate device, units, limits</text>
            <text x="380" y="94">2. Dispatch, then read back</text>
            <text x="380" y="116">3. Qualify the measurement</text>
            <text x="380" y="138">4. Refuse, stop or report partial effects</text>
            <text x="380" y="160">5. Audit before and after</text>
            <text x="665" y="46" fontSize="15" fontWeight="600">Instruments</text>
            <text x="665" y="72">Microscope</text>
            <text x="665" y="94">Mixed-signal scope</text>
            <text x="665" y="116">Robot arm</text>
            <text x="665" y="138">Liquid handler and reader</text>
            <text x="665" y="166" fontSize="11.5" fillOpacity="0.7">simulated today</text>
            <text x="214" y="78" fontSize="11.5">request</text>
            <text x="216" y="142" fontSize="11.5">evidence</text>
            <text x="539" y="78" fontSize="11.5">command</text>
            <text x="541" y="142" fontSize="11.5">readback</text>
          </g>
          <g stroke="currentColor" strokeWidth="2" fill="none">
            <line x1="180" y1="88" x2="252" y2="88" markerEnd="url(#tare-arrow)" />
            <line x1="505" y1="88" x2="577" y2="88" markerEnd="url(#tare-arrow)" />
            <line x1="252" y1="124" x2="185" y2="124" strokeDasharray="6 4" />
            <path d="M194 118 L183 124 L194 130" />
            <line x1="577" y1="124" x2="510" y2="124" strokeDasharray="6 4" />
            <path d="M519 118 L508 124 L519 130" />
          </g>
        </svg>
      </div>
      <figcaption className="mt-2 text-sm text-text-secondary">
        Every request takes the same path. Solid arrows carry requests and commands; dashed
        arrows carry readback and evidence back to the agent. The checks sit between the agent
        and the instruments, not inside the model.
      </figcaption>
    </figure>
  );
}

function AutofocusFigure() {
  const points = focusScan.map(([x, y]) => `${x},${y}`).join(" ");
  return (
    <figure className="sm:col-span-2">
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 900 280"
          role="img"
          aria-labelledby="tare-focus-title tare-focus-desc"
          className="h-auto w-full min-w-[480px] text-text-primary"
          fontSize="18"
        >
          <title id="tare-focus-title">Autofocus searches measured image quality</title>
          <desc id="tare-focus-desc">
            Recorded focus scores plotted against Z. The peak, 12 µm with score 0.462, is selected
            from returned measurements.
          </desc>
          <path d="M60 30 V215 H860" fill="none" stroke="currentColor" strokeOpacity="0.6" />
          <polyline points={points} fill="none" className="stroke-accent" strokeWidth="2" />
          {focusScan.map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="5" className="fill-accent" />
          ))}
          <g fill="currentColor">
            <text x="65" y="24">Image-gradient focus score</text>
            <text x="60" y="240" textAnchor="middle">0 µm</text>
            <text x="252.5" y="240" textAnchor="middle">6 µm</text>
            <text x="445" y="240" textAnchor="middle">12 µm</text>
            <text x="637.5" y="240" textAnchor="middle">18 µm</text>
            <text x="830" y="240" textAnchor="middle">24 µm</text>
            <text x="465" y="42">Peak: 12 µm, score 0.462</text>
            <text x="60" y="270" fillOpacity="0.7">Dots are measured samples; the line joins them.</text>
          </g>
        </svg>
      </div>
      <figcaption className="mt-2 text-sm text-text-secondary">
        <strong className="text-text-primary">Microscope:</strong> an autofocus scan picks the
        best Z from measured scores, not from the simulator&apos;s hidden answer.
      </figcaption>
    </figure>
  );
}

export default function ChatbotsAndInstrumentsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">
        Letting your chatbots talk with your Instruments
      </h1>
      <p className="mt-2 text-base text-text-secondary">
        My version of Anthropic&apos;s Model Hardware Standard (MHS)
      </p>
      <p className="mt-4 text-lg text-text-secondary">
        TARE (Trusted Adapter for Readback-verified Equipment) lets AI agents operate lab
        instruments, and checks what really happened. It is an independent design, built from
        Anthropic&apos;s public description of MHS.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <DownloadLink
          href="/static/tare-technical-brief.pdf"
          openInNewTab
          artifactId="tare-technical-brief"
          className={button}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Open the 4-page brief (PDF)
        </DownloadLink>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={button}>
          Code and evidence on GitHub
        </a>
        <ContactLink href={LINKEDIN_URL} method="linkedin" className={button}>
          LinkedIn post
        </ContactLink>
      </div>

      <nav aria-label="On this page" className="mt-8 text-sm text-text-secondary">
        <span className="font-medium text-text-primary">On this page:</span>{" "}
        {[
          ["#problem", "The problem"],
          ["#what-tare-does", "What TARE does"],
          ["#instruments", "Four simulated instruments"],
          ["#evidence", "Evidence"],
          ["#mhs", "Relationship to MHS"],
          ["#limits", "Limits"],
          ["#next-steps", "Next steps"],
        ].map(([href, label], i) => (
          <span key={href}>
            {i > 0 && " · "}
            <a href={href} className={link}>{label}</a>
          </span>
        ))}
      </nav>

      <section id="problem" className={`mt-8 ${card}`}>
        <h2 className={h2}>The problem</h2>
        <p className={body}>
          An instrument that answers &ldquo;OK&rdquo; has not necessarily done what it was told. A
          focus drive can acknowledge a command and stay where it was. A pipette can draw 16 µL when
          20 were requested. A reading can be two minutes old, or carry no stated uncertainty. A
          person at the bench notices these things. An AI agent driving the equipment will not,
          unless the layer between it and the instruments makes the evidence impossible to miss.
        </p>
        <p className={body}>
          TARE&apos;s rule: a command is not done until the instrument&apos;s own readback confirms
          it, and a measurement is not usable until its quality, age, calibration and uncertainty
          say so. The checks run outside the language model, so a model&apos;s mistake cannot talk
          its way past them.
        </p>
      </section>

      <section id="what-tare-does" className={`mt-8 ${card}`}>
        <h2 className={h2}>What TARE does</h2>
        <p className={body}>
          TARE gives an agent four operations: <strong className="text-text-primary">discover</strong>{" "}
          what the instruments can do, <strong className="text-text-primary">configure</strong> a
          setting, <strong className="text-text-primary">measure</strong>, and{" "}
          <strong className="text-text-primary">operate</strong> an action such as a robot move or an
          aspiration. Each request passes through the same path.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-6 text-text-secondary">
          {steps.map(([lead, rest]) => (
            <li key={lead}>
              <strong className="font-medium text-text-primary">{lead}</strong> {rest}
            </li>
          ))}
        </ol>
        <p className={body}>
          Agents reach TARE through MCP (Model Context Protocol), through a built-in chat lab running
          on a Claude subscription, or from Python. The model never touches an instrument directly.
        </p>
        <RequestPathFigure />
      </section>

      <section id="instruments" className={`mt-8 ${card}`}>
        <h2 className={h2}>Four simulated instruments</h2>
        <p className={body}>
          TARE currently runs four behavioral simulators sharing one virtual lab: a motorized
          microscope with image-based focus, an oscilloscope inspired by the HP 54645D with two
          analog and sixteen digital channels, a Cartesian robot arm that carries a plate between
          stations, and a liquid handler with a 96-well absorbance reader. They model the failure
          modes that matter to an agent: stuck axes, partial transfers, stale data, unknown
          uncertainty and readings that disagree with a reference.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <AutofocusFigure />
          <figure>
            <Image src="/assets/tare/oscilloscope.jpg" alt="Simulated oscilloscope display with two analog traces and sixteen digital channels" width={590} height={520} className="h-auto w-full rounded-lg border border-border" />
            <figcaption className="mt-2 text-sm text-text-secondary">
              <strong className="text-text-primary">Oscilloscope:</strong> analog and digital
              channels together, with trigger and threshold controls.
            </figcaption>
          </figure>
          <figure>
            <Image src="/assets/tare/robot-arm.jpg" alt="Robot arm path lifting a plate over a keep-out region between two stations" width={590} height={330} className="h-auto w-full rounded-lg border border-border" />
            <figcaption className="mt-2 text-sm text-text-secondary">
              <strong className="text-text-primary">Robot arm:</strong> the plate is lifted over a
              keep-out region before crossing to the lab station.
            </figcaption>
          </figure>
          <figure>
            <Image src="/assets/tare/liquid-handler.jpg" alt="Four-well dilution series with absorbance readings" width={590} height={340} className="h-auto w-full rounded-lg border border-border" />
            <figcaption className="mt-2 text-sm text-text-secondary">
              <strong className="text-text-primary">Liquid handler and reader:</strong> a four-well
              dilution series and its absorbance readings.
            </figcaption>
          </figure>
        </div>
      </section>

      <section id="evidence" className={`mt-8 ${card}`}>
        <h2 className={h2}>Evidence</h2>
        <p className={body}>The evidence comes at three levels, and each is reported separately.</p>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-text-secondary">
          <li>
            <strong className="font-medium text-text-primary">Software tests:</strong> 117 automated
            tests in the published repository cover validation, readback, fault handling, audit and
            the evaluation tooling.
          </li>
          <li>
            <strong className="font-medium text-text-primary">Simulated experiments:</strong> a
            coordinated four-instrument experiment of 80 service calls moves a plate, prepares four
            dilutions, checks plate and scope readings, and autofocuses on the result. 17 scripted
            scenarios matched their expected outcomes, including 13 injected faults stopped for the
            right reason. One scenario deliberately completes despite a stuck digital line, because
            the workflow does not check digital patterns; it is documented as a known gap.
          </li>
          <li>
            <strong className="font-medium text-text-primary">AI agent behavior:</strong> Claude
            models were tested on routine instrument dialogues with synthetic instrument results.
            Each dialogue covers translating the user&apos;s request into operations and explaining
            the results that come back.
          </li>
        </ul>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <caption className="sr-only">Claude results on routine instrument dialogues</caption>
            <thead>
              <tr className="border-b border-border text-text-primary">
                <th scope="col" className="py-2 pr-4 font-semibold">Model and effort</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Test</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Correct</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Critical errors</th>
                <th scope="col" className="py-2 font-semibold">Median time</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              {results.map((r) => (
                <tr key={`${r.model}-${r.test}`} className="border-b border-border/60">
                  <td className="py-2 pr-4">{r.model}</td>
                  <td className="py-2 pr-4">{r.test}</td>
                  <td className="py-2 pr-4">{r.correct}</td>
                  <td className="py-2 pr-4">0</td>
                  <td className="py-2">{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={body}>
          Both recorded misses were correct answers that TARE&apos;s automatic checker failed to
          recognize, &ldquo;doesn&apos;t agree&rdquo; in one case and &ldquo;confirmed&rdquo; in the
          other. The reviewer judged them correct, but the failures stay on the record because a
          review cannot overturn an automatic check. Both check patterns have since been fixed.
          Every dialogue, record and review is{" "}
          <a href={`${REPO_URL}/tree/main/Results`} target="_blank" rel="noopener noreferrer" className={link}>
            published in the repository
          </a>
          .
        </p>

        <h3 className="mt-6 text-lg font-semibold text-text-primary">What the dialogues show</h3>
        <ul className="mt-3 space-y-3 text-text-secondary">
          {behaviors.map(([lead, rest]) => (
            <li key={lead}>
              <strong className="font-medium text-text-primary">{lead}</strong> {rest}
            </li>
          ))}
        </ul>
      </section>

      <section id="mhs" className={`mt-8 ${card}`}>
        <h2 className={h2}>Relationship to Anthropic&apos;s Model Hardware Standard</h2>
        <p className={body}>
          On August 27, 2026, Anthropic opened a research preview of the{" "}
          <a href="https://modelhardwarestandard.com" target="_blank" rel="noopener noreferrer" className={link}>
            Model Hardware Standard (MHS)
          </a>
          , a shared way for AI agents to operate physical devices. Its public description covers
          device drivers, read and write operations, capability descriptions, and access through
          MCP, the command line and code. As of October 19, 2026, no public specification or code
          had been released; access is by application.
        </p>
        <p className={body}>
          TARE is my independent version of that idea, built only from the public material. It
          makes no claim of compatibility with MHS or affiliation with Anthropic. Its emphasis is
          the part an agent cannot see for itself: whether the instrument actually reached the
          requested state, and whether a measurement is fit to use.
        </p>
      </section>

      <section id="limits" className={`mt-8 ${card}`}>
        <h2 className={h2}>Limits</h2>
        <p className={body}>
          All four instruments are simulations, and the model tests use synthetic instrument
          results, so nothing here demonstrates physical accuracy or hardware safety. The model
          results are a screening study: 13 to 24 cases, run once or twice each, which is enough to
          find problems but not to certify reliability. The dialogues were reviewed by Claude
          models, Claude Fable 5.1 for the Opus 5.5 comparison, with model names hidden. That
          reviewer is still from the same family as the models under test, and an independent
          review by a qualified scientist has not yet been done.
        </p>
      </section>

      <section id="next-steps" className={`mt-8 ${card}`}>
        <h2 className={h2}>Next steps</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-text-secondary">
          <li>An independent human review of a sample of the recorded dialogues.</li>
          <li>
            A hosted demonstration at tare.samkirk.com, where visitors connect their own Claude or
            other chatbot to a private simulated lab.
          </li>
          <li>Real hardware, starting with an HP 54645D mixed-signal oscilloscope on the bench.</li>
        </ul>
        <p className={body}>
          The code, tests and every evaluation record are on{" "}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={link}>
            GitHub
          </a>{" "}
          under the MIT license.
        </p>
      </section>
    </div>
  );
}
