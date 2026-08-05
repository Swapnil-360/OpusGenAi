import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools-config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://opusgenai.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/signup`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/cookie-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/refund`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const toolPages: MetadataRoute.Sitemap = TOOLS.map((tool) => ({
    url: `${SITE_URL}${tool.href}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...toolPages];
}
