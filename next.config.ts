import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static build (out/) for Cloudflare Pages.
  output: "export",
  trailingSlash: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
