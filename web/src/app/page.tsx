import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="relative">
        <div className="flex flex-col items-center md:flex-row md:items-start md:gap-8">
          {/* Profile Photo */}
          <div className="mb-6 flex-shrink-0 md:mb-0">
            <Image
              src="/profile-photo.jpg"
              alt="Sam Kirk"
              width={192}
              height={256}
              className="w-40 md:w-48 rounded-lg border-4 border-accent/30 shadow-lg"
              priority
            />
          </div>

          {/* Text Content */}
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
              Sam Kirk
            </h1>
            <p className="mt-2 text-lg text-text-muted">
              Fremont, California
            </p>
            <p className="mt-4 text-xl leading-8 text-text-secondary">
              Software engineer with expertise in genAI mainly with Cursor and Claude Code for full-stack development,
              and building products that solve real problems. Decades of
              experience in test automation at all levels of the computer stack
              to make sure your genAI product runs right; includes firmware that
              tests hardware.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions for Hiring Managers */}
      <section className="mt-8">
        <h2 className="text-center text-2xl font-semibold text-text-primary">
          Hiring Manager?
        </h2>
        <div className="mx-auto mt-2 max-w-md text-text-secondary">
          <p>Regarding your job opportunity:</p>
          <ul className="mt-1 list-disc space-y-1 pl-6">
            <li>Evaluate my fitness: strong, average and weak aspects</li>
            <li>Generate a tailored resume</li>
          </ul>
          <p className="mt-1">
            Or just have a casual chat about my professional experience.
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-6">
            <li>All output including a chat transcript are downloadable</li>
          </ul>
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/hire-me"
            className="inline-block rounded-lg bg-accent px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-accent-hover"
          >
            Interview me NOW &rarr;
          </Link>
        </div>
      </section>

      {/* Table of Contents */}
      <div className="mt-8 space-y-10">
        <section>
          <h2 className="text-2xl font-semibold text-text-primary">
            My Dance Menu
          </h2>
          <p className="mt-1 text-text-secondary">
            Weekly curated playlists for social dancers — Swing, Waltz, Two Step, and more.
          </p>
          <ul className="mt-1 list-disc pl-5 text-sm text-text-muted">
            <li>Curated with Claude Cowork</li>
          </ul>
          <Link
            href="/dance-menu"
            className="mt-2 inline-block font-medium text-accent hover:text-accent-hover"
          >
            View this week&apos;s menu &rarr;
          </Link>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-primary">
            Photo Fun
          </h2>
          <p className="mt-1 text-text-secondary">
            Turn any photo into art with Google Gemini — try Professional, Claymation, Cyberpunk, Pencil Sketch, and any custom style.
          </p>
          <ul className="mt-1 list-disc pl-5 text-sm text-text-muted">
            <li>An aistudio.google.com website prototype made right with Cursor and hosted on Vercel.com with a switch over to Vertex AI for the best production image model.</li>
          </ul>
          <a
            href="https://photo-fun.samkirk.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block font-medium text-accent hover:text-accent-hover"
          >
            Try Photo Fun &rarr;
          </a>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-primary">
            Villa Madu Bali
          </h2>
          <p className="mt-1 text-text-secondary">
            A lovely, exotic Indonesian resort in Bali.
          </p>
          <ul className="mt-1 list-disc pl-5 text-sm text-text-muted">
            <li>Done on www.Replit.com after trying two other non-coding AI web site builders to replace the old version written in WordPress.</li>
          </ul>
          <a
            href="https://www.villamadubali.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block font-medium text-accent hover:text-accent-hover"
          >
            Visit VillaMaduBali.com &rarr;
          </a>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-primary">
            Song Dedication to Mom
          </h2>
          <p className="mt-1 text-text-secondary">
            A song for Mom with the story and lyrics behind it.
          </p>
          <ul className="mt-1 list-disc pl-5 text-sm text-text-muted">
            <li>Lyrics done in ChatGPT; sound track done on www.udio.com.</li>
          </ul>
          <Link
            href="/song-dedication"
            className="mt-2 inline-block font-medium text-accent hover:text-accent-hover"
          >
            Listen and read the dedication &rarr;
          </Link>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-primary">
            Explorations
          </h2>
          <p className="mt-1 text-text-secondary">
            Side projects, experiments, and things I&apos;m building for fun — the workshop behind the portfolio.
          </p>
          <Link
            href="/explorations"
            className="mt-2 inline-block font-medium text-accent hover:text-accent-hover"
          >
            Browse explorations &rarr;
          </Link>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-primary">
            This Showcase of genAI
          </h2>
          <p className="mt-1 text-text-secondary">
            This site was built using state-of-the-art generative AI
            methods, layering Matt Maher&apos;s do-work methodology on top
            of Dylan Davis&apos; 3-document method.
          </p>
          <a
            href="https://github.com/MrBesterTester/samkirk.com-v3"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block font-medium text-accent hover:text-accent-hover"
          >
            View the source on GitHub &rarr;
          </a>
        </section>
      </div>
    </div>
  );
}
