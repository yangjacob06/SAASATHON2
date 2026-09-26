import type { Metadata } from "next";

import { CtaBand } from "@/components/marketing/CtaBand";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Nav } from "@/components/marketing/Nav";
import { Pricing } from "@/components/marketing/Pricing";
import { ProductPreview } from "@/components/marketing/ProductPreview";
import { StatBand } from "@/components/marketing/StatBand";

export const metadata: Metadata = {
  title: "The platform",
  description:
    "Prepare lender-ready deal summaries, match New Zealand non-bank lenders and track every private-credit application through to settlement.",
};

/**
 * Experience 02 — the platform page, ordered as an argument: what it is, what it does, what
 * it looks like, how it works, why the market needs it, what it costs, and
 * the ask. Light sections carry the product story; the two dark bands
 * (StatBand, CtaBand) punctuate it.
 */
export default function PlatformPage() {
  return (
    <>
      <Nav floating />
      <main>
        <Hero />
        <FeatureGrid />
        <ProductPreview />
        <HowItWorks />
        <StatBand />
        <Pricing />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
