"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Menu } from "lucide-react";
import { TOOLS } from "@/lib/tools-config";
import { LogoBrand } from "@/components/shared/LogoBrand";

const NAV_LINKS = [
  { href: "/", label: "Home", section: null },
  { href: "#tools", label: "Tools", section: "tools" },
  { href: "#templates", label: "Templates", section: "templates" },
  { href: "#pricing", label: "Pricing", section: "pricing" },
];

export function LandingNav() {
  const [active, setActive] = useState("Home");
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Track active section on scroll */
  useEffect(() => {
    const handler = () => {
      const ids = ["tools", "templates", "pricing"];
      let found = "Home";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) {
          const { top } = el.getBoundingClientRect();
          if (top <= 120) {
            found = id.charAt(0).toUpperCase() + id.slice(1);
          }
        }
      }
      setActive(found);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <header
        className="fixed inset-x-0 z-50"
        style={{
          top: "var(--site-banner-h, 0px)",
          background: "rgba(15,4,4,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 h-16 relative flex items-center">

          {/* ── Logo (left) ── */}
          <Link href="/" className="shrink-0">
            <LogoBrand imgClass="h-11 w-auto" />
          </Link>

          {/* ── Center pill nav (truly centered via absolute) ── */}
          <nav className="hidden md:block absolute left-1/2 -translate-x-1/2">
            <div
              className="flex items-center p-1 rounded-full"
              style={{
                background: "rgba(16,16,16,0.92)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
              }}
            >
              {NAV_LINKS.map(({ href, label }) => {
                const isActive = label === active;
                return (
                  <Link key={href} href={href} className="relative">
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full"
                        style={{ background: "#dc2626" }}
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      />
                    )}
                    <span
                      className="relative z-10 block px-4 py-1.75 rounded-full text-[13px] font-semibold transition-colors"
                      style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.42)" }}
                    >
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* ── Right actions ── */}
          <div className="ml-auto hidden md:flex items-center gap-2">
            <Link href="/login">
              <button
                className="px-4 py-1.5 text-[13px] font-medium transition-colors"
                style={{ color: "rgba(255,255,255,0.38)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.38)")}
              >
                Sign in
              </button>
            </Link>
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(220,38,38,0.5)" }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-[13px] transition-all"
                style={{ boxShadow: "0 0 18px rgba(220,38,38,0.25)" }}
              >
                Start free
              </motion.button>
            </Link>
          </div>

          {/* ── Mobile: Menu pill button ── */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden ml-auto flex items-center gap-2 px-4 py-1.75 rounded-full font-bold text-[13px] text-white transition-colors"
            style={{
              background: mobileOpen ? "rgba(180,20,20,1)" : "#dc2626",
              boxShadow: "0 0 20px rgba(220,38,38,0.3)",
            }}
          >
            {mobileOpen ? (
              <>
                Menu <X className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Menu <Menu className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* ── Mobile overlay menu ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="md:hidden mx-4 mt-1 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(10,10,10,0.97)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
              }}
            >
              <div className="p-3 space-y-0.5">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{ color: "rgba(255,255,255,0.65)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = "rgba(255,255,255,1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                    }}
                  >
                    {label}
                  </Link>
                ))}
                <div className="h-px my-1" style={{ background: "rgba(255,255,255,0.05)" }} />
                {/* Tools */}
                {TOOLS.map((tool) => (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: `${tool.accentColor}20` }}
                    >
                      <Sparkles className="w-2.5 h-2.5" style={{ color: tool.accentColor }} />
                    </div>
                    <span className="text-[13px] font-medium">{tool.label}</span>
                  </Link>
                ))}
                <div className="h-px my-1" style={{ background: "rgba(255,255,255,0.05)" }} />
                <div className="flex gap-2 p-1">
                  <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <button
                      className="w-full h-10 rounded-xl text-sm font-medium transition-colors"
                      style={{
                        border: "1px solid rgba(255,255,255,0.09)",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      Sign in
                    </button>
                  </Link>
                  <Link href="/signup" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <button className="w-full h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-colors">
                      Start free
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}
