"use client";

import Link from "next/link";
import { LogoBrand } from "@/components/shared/LogoBrand";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0f0404", color: "rgba(255,255,255,0.88)" }}>
      {/* Atmospheric glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          background:
            "radial-gradient(ellipse at 60% 0%, rgba(140,10,10,0.18) 0%, transparent 50%)",
        }}
      />

      {/* Header */}
      <header
        className="relative z-10 flex items-center px-6 h-16 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <Link href="/">
          <LogoBrand imgClass="h-9 w-auto" />
        </Link>
        <nav className="ml-auto flex items-center gap-5">
          <Link
            href="/"
            className="text-xs transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.88)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.4)"; }}
          >
            ← Back to home
          </Link>
        </nav>
      </header>

      {/* Page content */}
      <main className="relative z-10 flex-1">{children}</main>

      {/* Footer */}
      <div className="relative z-10">
        <LandingFooter />
      </div>
    </div>
  );
}
