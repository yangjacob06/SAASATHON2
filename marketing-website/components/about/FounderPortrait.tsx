import Image from "next/image";

import type { Founder } from "@/lib/founders";

/**
 * A founder's portrait, or the frame that is waiting for one.
 *
 * The pending state is drawn rather than left blank: the initial set large
 * in the display serif over the same drafting grid the opening uses, so
 * a page with no photography yet still looks art-directed instead of
 * broken. Swapping in a real image changes nothing else about the layout,
 * because both states occupy the identical 4:5 frame.
 */
export function FounderPortrait({ founder, index }: { founder: Founder; index: number }) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2px] bg-[#1b2126]">
      {founder.portrait ? (
        <Image
          src={founder.portrait}
          alt={`${founder.name}, founder`}
          fill
          sizes="(max-width: 1024px) 60vw, 28vw"
          placeholder="blur"
          className="object-cover"
        />
      ) : (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgb(154 163 170 / 0.22) 1px, transparent 1px), linear-gradient(to bottom, rgb(154 163 170 / 0.22) 1px, transparent 1px)",
              backgroundSize: "2.25rem 2.25rem",
            }}
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 grid place-items-center font-display text-[7rem] leading-none text-graphite/[0.10]"
          >
            {founder.name.charAt(0)}
          </span>
          {/* A light rake across the plate, so four identical frames still
              read as objects rather than as empty boxes. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(150deg,rgb(238_241_243/0.05),transparent_55%)]"
          />
          <span className="tech absolute bottom-3 left-3 !text-[9px]">
            Portrait {String(index + 1).padStart(2, "0")} · pending
          </span>
        </>
      )}
      {/* A constant tonal wash keeps the four frames reading as one set. */}
      <div aria-hidden="true" className="absolute inset-0 ring-1 ring-inset ring-graphite/[0.10]" />
    </div>
  );
}
