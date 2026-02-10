export default function SongDedicationPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">
        Resilience in the Storm
      </h1>
      <p className="mt-4 text-lg text-text-secondary">
        A song created for my mother using ChatGPT and Udio.com. It celebrates
        her strength through hurricanes Ian and Milton.
      </p>

      {/* Audio Section */}
      <section className="mt-12">
        <div className="rounded-xl border border-border bg-primary p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-text-primary">Listen</h2>
          <div className="mt-4">
            <audio controls className="w-full">
              <source
                src="/assets/Resilience in the Storm.mp3"
                type="audio/mpeg"
              />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      </section>

      {/* Lyrics Section */}
      <section className="mt-8">
        <div className="rounded-xl border border-border bg-primary p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-text-primary">Lyrics</h2>
          <div className="mt-4 space-y-6">
            <p className="text-sm italic text-text-muted">
              I Will Survive (Hurricane Edition for Mom)
            </p>

            {/* Verse 1 */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Verse 1
              </p>
              <p className="whitespace-pre-line text-text-secondary">
                {`At first, I was afraid, I was petrified,
Watching those dark clouds roll in with nowhere to hide.
I've been through so many storms, I've learned to hold my ground,
I knew somehow, I'd make it through, no way I'd get knocked down.`}
              </p>
            </div>

            {/* Pre-Chorus 1 */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Pre-Chorus
              </p>
              <p className="whitespace-pre-line text-text-secondary">
                {`Oh, I watched those trees, swaying in the breeze,
Boarded up the windows, just to give my heart some ease.
I knew that wind would howl, like it always does,
But I've been here before, and I know just what it was.`}
              </p>
            </div>

            {/* Chorus 1 */}
            <div className="rounded-lg bg-secondary p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Chorus
              </p>
              <p className="whitespace-pre-line font-medium text-text-primary">
                {`Oh yes, I survive, every storm that comes alive,
I've felt the worst of Hurricane Ian, and still, I thrive.
I've got my strength, my stubborn will, and a spirit that's alive,
I survive, oh I survive, yeah yeah!`}
              </p>
            </div>

            {/* Verse 2 */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Verse 2
              </p>
              <p className="whitespace-pre-line text-text-secondary">
                {`It's Ft Myers here, where I've spent my years,
Hurricanes can't take away all that I hold dear.
Oh, they may huff and puff, but they won't bring me down,
In my heart, I'm standing tall, with my feet on solid ground.`}
              </p>
            </div>

            {/* Pre-Chorus 2 */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Pre-Chorus
              </p>
              <p className="whitespace-pre-line text-text-secondary">
                {`Through winds that wail and rain that pounds,
The storm will pass, but here I'm safe and sound.
For I know my way, I know the drill,
And I'll be here long after those winds stand still.`}
              </p>
            </div>

            {/* Chorus 2 */}
            <div className="rounded-lg bg-secondary p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Chorus
              </p>
              <p className="whitespace-pre-line font-medium text-text-primary">
                {`Oh yes, I survive, every storm that comes alive,
Even mighty Hurricane Milton, I'll wave goodbye.
With a heart so bold and strong, I'm here to stay, I'll carry on,
I survive, I survive, every day, yeah yeah!`}
              </p>
            </div>

            {/* Outro */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Outro
              </p>
              <p className="whitespace-pre-line text-text-secondary">
                {`I've faced the winds, I've faced the rain,
But I'm still here, singing my refrain.
From storm to storm, I've stayed alive,
For 93 years strong, yes, I will survive!`}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-4">
            <a
              href="https://chatgpt.com/share/6924cdc3-cb0c-800d-b2d5-599def3d2114"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-accent hover:text-accent-hover"
            >
              View ChatGPT Thread &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Song Info Footer */}
      <footer className="mt-8 text-center text-sm text-text-muted">
        <p>
          Created with{" "}
          <span className="font-medium">ChatGPT</span> and{" "}
          <span className="font-medium">Udio.com</span>
        </p>
      </footer>
    </div>
  );
}
