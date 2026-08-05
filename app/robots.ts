import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://opusgenai.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Everything below requires auth and just redirects crawlers to /login —
      // disallowed so crawl budget goes to actual marketing/content pages.
      disallow: [
        "/generate",
        "/studio",
        "/history",
        "/account",
        "/templates",
        "/adminopusgenai",
        "/mfa-challenge",
        "/api/",
        "/auth/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
