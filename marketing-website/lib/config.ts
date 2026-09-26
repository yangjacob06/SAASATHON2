/**
 * Site-wide configuration.
 *
 * The site is two experiences. `/` is the brand opening — dark, WebGL,
 * deliberately experimental. Everything past the opening CTA is the product
 * world: clear, structured, conversion-shaped.
 *
 * `SOFTWARE_URL` is the boundary between the marketing site and Ollie's
 * separately hosted interactive software demo.
 */
export const SOFTWARE_URL = "https://mandate-ollie-software.vercel.app/";

/** True when the platform lives outside this app, so links open accordingly. */
export const SOFTWARE_IS_EXTERNAL = /^https?:\/\//.test(SOFTWARE_URL);

/** Anchors inside the platform page, resolved against wherever it lives. */
export function softwareAnchor(hash: string): string {
  return `${SOFTWARE_URL}#${hash}`;
}

/** The word the brand uses for crossing from the opening into the product. */
export const ENTER_LABEL = "Enter the platform";
