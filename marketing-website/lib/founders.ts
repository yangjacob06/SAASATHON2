import type { StaticImageData } from "next/image";

/**
 * The four founders.
 *
 * Roles and contributions below come from the founders themselves. The
 * portraits do not exist yet — `portrait` is undefined for all four, and
 * `FounderPortrait` renders a deliberate pending frame rather than a gap.
 *
 * To add a portrait: drop the file into `assets/founders/`, import it, and
 * set `portrait`. Nothing else changes — every layout reads from this
 * array, and the order here is the order on the page.
 */
export interface Founder {
  /** Stable key, also used in the URL fragment for deep links. */
  id: string;
  name: string;
  role: string;
  /** One or two sentences: what this person actually does here. */
  contribution: string;
  /** The areas they own. Short — these are set as labels, not sentences. */
  focus: string[];
  portrait?: StaticImageData;
}

export const FOUNDERS: Founder[] = [
  {
    id: "jacob",
    name: "Jacob",
    role: "Architecture and operations",
    contribution:
      "Decides how the system is put together, and keeps the company running around it — the architecture the product is built on, and the finance, compliance and admin behind it.",
    focus: ["Architecture", "Operations", "Compliance"],
  },
  {
    id: "tyler",
    name: "Tyler",
    role: "Design and interface",
    contribution:
      "Owns one visual system across the product and the brand, and writes the front-end that implements it. What an adviser sees and what everyone else sees are the same decision.",
    focus: ["Design system", "Interface", "Brand"],
  },
  {
    id: "ollie",
    name: "Ollie",
    role: "Platform engineering",
    contribution:
      "Builds the back end the rest of the product stands on — the data model, the APIs, deployment, and the security around client documents.",
    focus: ["Back end", "Infrastructure", "Security"],
  },
  {
    id: "oliver",
    name: "Oliver",
    role: "Commercial",
    contribution:
      "Works both sides of the market: the advisers who use Mandate day to day, and the non-bank lenders whose mandates it matches against. The commercial relationships are his.",
    focus: ["Advisers", "Lender network", "Go-to-market"],
  },
];
