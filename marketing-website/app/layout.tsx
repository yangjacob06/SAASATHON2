import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

import { Grain } from "@/components/ui/Grain";
import { RevealProvider } from "@/components/ui/RevealProvider";
import "./globals.css";

/** Fraunces carries every headline — an editorial serif with real presence at display size. */
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

/** Inter does the work everywhere else, including inside forms and tables. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3310"),
  title: {
    default: "Mandate — private-credit deals, placed faster",
    template: "%s · Mandate",
  },
  description:
    "Mandate helps New Zealand commercial finance advisers prepare deal summaries, match non-bank lenders and track loan applications from first enquiry to settlement.",
  openGraph: {
    title: "Mandate",
    description:
      "Prepare and place private-credit deals in minutes, not days. Built for New Zealand commercial finance advisers.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f3f2ee",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NZ" className={`${fraunces.variable} ${inter.variable}`} suppressHydrationWarning>
      <body>
        {children}
        <Grain />
        <RevealProvider />
      </body>
    </html>
  );
}
