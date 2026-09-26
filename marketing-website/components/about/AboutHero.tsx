import { SplitText } from "@/components/brand/SplitText";
import { FOUNDERS } from "@/lib/founders";

/**
 * The About opening.
 *
 * Same register as the brand opening — technical index, oversized serif,
 * hairline rules — but no lattice. The 3D belongs to the page about the
 * product; this page is about people, and its ground is a photograph of
 * the place instead. The four names sit under the headline as a row of
 * equals, which is the whole argument of the page stated once, before any
 * copy.
 */
export function AboutHero() {
  return (
    <section className="relative flex min-h-[80vh] flex-col justify-end overflow-hidden pb-14 pt-32 sm:pb-16">
      <div className="shell relative">
        <div
          data-reveal="fade"
          style={{ "--reveal-delay": "0ms" } as React.CSSProperties}
          className="flex flex-wrap items-center gap-x-5 gap-y-2"
        >
          <span className="tech tech-accent">About</span>
          <span className="hidden h-px w-10 bg-rule sm:block" />
          <span className="tech">Four founders</span>
          <span className="hidden h-px w-10 bg-rule sm:block" />
          <span className="tech">Christchurch · NZ</span>
        </div>

        <h1
          data-reveal="fade"
          style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
          className="display-xl mt-8 text-graphite"
        >
          <span className="block">
            <SplitText text="We wanted a better" />
          </span>
          <span className="block">
            <SplitText text="way to get deals" delay={130} />
          </span>
          <span className="block text-graphite/60">
            <SplitText text="done." delay={260} />
          </span>
        </h1>

        {/* The four, as equals, before a word is said about any of them. */}
        <ul
          data-reveal="fade"
          style={{ "--reveal-delay": "420ms" } as React.CSSProperties}
          className="mt-12 grid grid-cols-2 gap-px overflow-hidden border-y border-graphite/20 bg-graphite/20 sm:grid-cols-4"
        >
          {FOUNDERS.map((founder, i) => (
            <li key={founder.id} className="bg-paper px-3 py-5 sm:px-4">
              <span className="tech block">{String(i + 1).padStart(2, "0")}</span>
              <a
                href={`#${founder.id}`}
                data-cursor="link"
                className="headline mt-2 block text-[clamp(1.5rem,1.1rem+1.2vw,2rem)] text-graphite transition-colors duration-300 hover:text-signal"
              >
                {founder.name}
              </a>
            </li>
          ))}
        </ul>

        <p
          data-reveal="fade"
          style={{ "--reveal-delay": "540ms" } as React.CSSProperties}
          className="mt-8 max-w-xl text-[16px] leading-relaxed text-graphite/75"
        >
          Four of us, working on one product. We write the code, talk to the advisers who will use
          it, and decide what ships. There is nobody in between.
        </p>

        {/*
          The last thing to arrive, and the only thing on this page that
          asks for an action. The rule draws itself down rather than fading,
          so it reads as a direction rather than as another element landing.
        */}
        <div
          data-reveal="fade"
          style={{ "--reveal-delay": "660ms" } as React.CSSProperties}
          className="mt-14 flex items-center gap-4"
        >
          <span
            className="scroll-cue-line block h-10 w-px bg-graphite/35"
            style={{ "--reveal-delay": "660ms" } as React.CSSProperties}
            aria-hidden="true"
          />
          <span className="tech">Scroll</span>
        </div>
      </div>
    </section>
  );
}
