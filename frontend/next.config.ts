import type { NextConfig } from "next";

const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
const posthogAssetsHost = posthogHost.replace(
  ".i.posthog.com",
  "-assets.i.posthog.com",
);

const nextConfig: NextConfig = {
  output: "standalone",
  // Lets the E2E suite build into its own folder without touching a running dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {},
  // Required so PostHog's trailing-slash API requests are proxied untouched.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${posthogAssetsHost}/static/:path*`,
      },
      {
        source: "/ingest/array/:path*",
        destination: `${posthogAssetsHost}/array/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${posthogHost}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      new URL(
        "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/refs/heads/main/**",
      ),
    ],
  },
};

export default nextConfig;
