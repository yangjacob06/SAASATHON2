import type { Metadata } from "next";

import { Footer } from "@/components/marketing/Footer";
import { Nav } from "@/components/marketing/Nav";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div>
      <Nav />
      <main className="mx-auto max-w-2xl px-6 pb-24 pt-32">
        <p className="text-[13px] font-medium uppercase tracking-wide text-grey">Privacy</p>
        <h1 className="mt-3 font-display text-4xl text-graphite">How we handle your data</h1>

        <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-graphite-soft">
          <p>
            Every application, document and note you enter into Mandate belongs to your adviser
            account. Other advisers using Mandate cannot see your applications, your clients&rsquo;
            documents, or the lenders you&rsquo;ve matched — each account only ever sees its own
            work.
          </p>
          <p>
            Client documents you upload (valuations, feasibility studies, financials) are stored
            securely and are used only to prepare the deal summary for that application. They are
            never shared with lenders, other advisers, or any third party without your action —
            sending a summary to a lender is something you choose to do, not something Mandate
            does automatically.
          </p>
          <p>
            Where a deal summary is generated with an AI model, the form fields and the extracted
            text of your uploaded documents are sent to that model provider for the sole purpose
            of drafting the summary. Nothing is retained by Mandate beyond your own account&rsquo;s
            records.
          </p>
          <p>
            If you delete an application, its documents, summary and lender matches are deleted
            with it.
          </p>
          <p className="text-grey">
            This is a general notice for the Mandate product, not legal advice. Contact your
            account administrator with any questions about a specific client&rsquo;s data.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
