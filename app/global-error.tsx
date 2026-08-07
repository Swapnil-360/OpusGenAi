"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Next's root-level error boundary — catches errors the normal error.tsx
// boundaries miss because they occur above them (root layout, providers).
// Renders its own <html>/<body> since it replaces the entire tree.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: "#0f0404", color: "rgba(255,255,255,0.9)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 20 }}>
            We&apos;ve been notified and are looking into it.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Reload page
          </button>
        </div>
      </body>
    </html>
  );
}
