import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `pg` is Node-only; keep it out of the bundler's module graph.
  serverExternalPackages: ["pg", "pdf-lib"],
  // Keep the unchanged legacy comparator's data and rules available to Vercel Functions.
  outputFileTracingIncludes: {
    "/*": ["./lib/synthetic/*.js"],
  },
  experimental: {
    // Enough for the provided synthetic CSV fixtures; Vercel caps function
    // request bodies below 4.5 MB, so larger uploads should use direct storage uploads.
    serverActions: { bodySizeLimit: "4mb" },
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
