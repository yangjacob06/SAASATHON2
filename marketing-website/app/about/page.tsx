import type { Metadata } from "next";

import { AboutCta } from "@/components/about/AboutCta";
import { AboutHero } from "@/components/about/AboutHero";
import { FounderIndex } from "@/components/about/FounderIndex";
import { HowWeWork } from "@/components/about/HowWeWork";
import { Origin } from "@/components/about/Origin";
import { BrandFooter } from "@/components/brand/BrandFooter";
import { BrandNav } from "@/components/brand/BrandNav";
import { Cursor } from "@/components/brand/Cursor";

export const metadata: Metadata = {
  title: "About",
  description:
    "Mandate is built in Christchurch by four founders who write the product themselves. Why we started, how we work, and what we think is outdated about private-credit deal preparation.",
};

/**
 * The About page.
 *
 * Same world as the brand opening — near-black, the same rules, the same
 * technical register — with one deliberate difference: no lattice. The
 * opening uses geometry to say what the software does; this page is about
 * the people who made it, and putting WebGL behind their names would be
 * the page performing instead of speaking.
 *
 * The order is people → why → how → product: who, before the argument,
 * before the proof.
 */
export default function AboutPage() {
  return (
    <div className="world">
      <Cursor />
      <BrandNav />
      <main>
        <AboutHero />
        <Origin />
        <FounderIndex />
        <HowWeWork />
        <AboutCta />
      </main>
      <BrandFooter />
    </div>
  );
}
