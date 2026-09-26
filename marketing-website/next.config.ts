import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `pg` is Node-only; keep it out of the bundler's module graph.
  serverExternalPackages: ["pg", "pdf-lib"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
