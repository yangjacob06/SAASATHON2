import type { Metadata } from "next";

import { BrandFooter } from "@/components/brand/BrandFooter";
import { BrandHero } from "@/components/brand/BrandHero";
import { BrandNav } from "@/components/brand/BrandNav";
import { BrandStatement } from "@/components/brand/BrandStatement";
import { ClosingCta } from "@/components/brand/ClosingCta";
import { Cursor } from "@/components/brand/Cursor";
import { Intro } from "@/components/brand/Intro";
import { PlaceBand } from "@/components/brand/PlaceBand";
import { PlatformPreview } from "@/components/brand/PlatformPreview";
import { Thesis } from "@/components/brand/Thesis";

export const metadata: Metadata = {
  title: "Mandate — private credit, structured",
  description:
    "Mandate is the instrument New Zealand commercial finance advisers use to prepare, match and track private-credit deals.",
};

/**
 * Experience 01 — the brand opening.
 *
 * Paced deliberately: immersive, then declarative, then plain, then human,
 * then the product itself. The visual temperature drops section by section,
 * so by the time a visitor reaches the platform link they have stopped
 * looking at a brand and started reading about software. That descent is
 * the page's whole structure.
 *
 * Experience 02 lives at `SOFTWARE_URL` (`/platform`).
 */
export default function BrandPage() {
  return (
    <div className="world">
      <Intro />
      <Cursor />
      <BrandNav />
      <main>
        <BrandHero />
        <BrandStatement />
        <Thesis />
        <PlaceBand />
        <PlatformPreview />
        <ClosingCta />
      </main>
      <BrandFooter />
    </div>
  );
}
