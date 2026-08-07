import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";
import { withSentryConfig } from "@sentry/nextjs";

// Template preview images live in Supabase Storage (public bucket) — derive
// the project hostname from the existing env var instead of hardcoding it.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

// Built from the real external hosts this app talks to (verified by grepping
// every fetch/img/script call, not guessed): Supabase (auth + REST + storage),
// fal.media (generated/template images, plain <img>, not next/image), Google
// avatar photos, picsum placeholders, unpkg (WASM model data for
// @imgly/background-removal), and Vercel's own analytics beacons. Dev keeps
// 'unsafe-eval' for HMR; production does not.
const isDev = process.env.NODE_ENV !== "production";
const CSP = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-src 'none'`,
  `frame-ancestors 'self'`,
  `form-action 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
  `style-src 'self' 'unsafe-inline'`,
  `font-src 'self' data:`,
  `worker-src 'self' blob: https://unpkg.com`,
  `img-src 'self' data: blob: https://*.googleusercontent.com https://picsum.photos https://fastly.picsum.photos https://fal.media https://*.fal.media${supabaseHostname ? ` https://${supabaseHostname}` : ""}`,
  `connect-src 'self' https://unpkg.com https://va.vercel-scripts.com https://vitals.vercel-insights.com${supabaseHostname ? ` https://${supabaseHostname}` : ""}`,
  `upgrade-insecure-requests`,
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      ...(supabaseHostname ? [{ protocol: "https" as const, hostname: supabaseHostname }] : []),
    ],
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,
      "onnxruntime-node$": false,
    };
    if (!isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };
    }
    return config;
  },
};

export default withSentryConfig(withBotId(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  // Routes client-side event delivery through our own origin instead of
  // directly to Sentry's ingest host — keeps the CSP connect-src limited to
  // 'self' and avoids ad blockers dropping a third-party sentry.io request.
  tunnelRoute: "/monitoring",
  webpack: {
    automaticVercelMonitors: true,
  },
});
