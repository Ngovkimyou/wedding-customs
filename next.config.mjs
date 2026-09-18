import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";
import { buildSecurityHeaders } from "./lib/security-policy.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = (phase) => ({
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: buildSecurityHeaders({
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          isDevelopment: phase === PHASE_DEVELOPMENT_SERVER,
        }),
      },
    ];
  },
  // Keep dev artifacts separate from production output so a build cannot
  // invalidate chunks used by an active development server.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  webpack(config, { dev }) {
    // Windows can race with Webpack's compressed filesystem cache during HMR,
    // leaving a pack missing when Webpack tries to rename it on refresh.
    // Keep the production cache, but disable the filesystem cache in dev.
    if (dev) {
      config.cache = false;
    }

    config.module.rules.push({
      test: /\.(mp3|wav|ogg|m4a)$/i,
      type: "asset/resource",
    });

    return config;
  },
});

export default nextConfig;
