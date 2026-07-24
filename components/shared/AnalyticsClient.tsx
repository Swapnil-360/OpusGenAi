"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";

// Mounts only after hydration — the /next variant calls useSearchParams()
// internally, which was tripping a Server Components render error during
// static prerendering of "/" on Next 15.5.21. Deferring past mount avoids it.
export function AnalyticsClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <Analytics />;
}
