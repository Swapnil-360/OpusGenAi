"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  ExternalLink,
  Instagram,
  Mail,
  Send,
  Twitter,
} from "lucide-react";
import { LogoBrand } from "@/components/shared/LogoBrand";
import { FeedbackButton } from "@/components/shared/FeedbackModal";
import { toast } from "sonner";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const W = {
  text: "rgba(255,255,255,0.88)",
  muted: "rgba(255,255,255,0.45)",
  dim: "rgba(255,255,255,0.22)",
  border: "rgba(255,255,255,0.07)",
  glass: "rgba(255,255,255,0.04)",
  glassMid: "rgba(255,255,255,0.06)",
  red: "#f87171",
};

const NAV = {
  Product: [
    { label: "Generate Images", href: "/generate" },
    { label: "Templates", href: "/templates" },

    { label: "Remove Background", href: "/tools/remove-bg" },
    { label: "Replace Background", href: "/tools/replace-bg" },
    { label: "Upscale 4×", href: "/tools/upscale" },
    { label: "Pricing", href: "/#pricing" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookie-policy" },
    { label: "Refund Policy", href: "/refund" },
  ],
};

const CONNECT: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  highlight?: boolean;
}[] = [
  {
    icon: Instagram,
    label: "Instagram",
    href: "https://www.instagram.com/theopusgenai?igsh=djJ3bjB2d3VieGQ3&utm_source=qr",
  },
  {
    icon: Twitter,
    label: "Twitter / X",
    href: "https://x.com/theopusgenai?s=11",
  },
  {
    icon: FacebookIcon,
    label: "Facebook",
    href: "https://www.facebook.com/share/1DMcoCjcLN/?mibextid=wwXIfr",
  },
  {
    icon: Mail,
    label: "opusgenai.official@gmail.com",
    href: "https://mail.google.com/mail/?view=cm&to=opusgenai.official@gmail.com&su=OpusGen+AI+Inquiry",
  },
  {
    icon: ExternalLink,
    label: "Developer Portfolio",
    href: "https://www.mrswapnil.me",
    highlight: true,
  },
];

export function LandingFooter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
    setEmail("");
    toast.success("You're on the list!");
    setTimeout(() => setDone(false), 4000);
  }

  return (
    <footer
      style={{
        background: "#080101",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        {/* ── Main grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-6 xl:gap-10">
          {/* ── Brand + newsletter — takes 2 of 5 cols ──────────────── */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-5">
              <LogoBrand imgClass="h-9 w-auto" />
            </Link>

            <p
              className="text-sm leading-relaxed mb-7 max-w-xs"
              style={{ color: W.muted }}
            >
              AI-powered product photography studio. Create studio-quality
              visuals in seconds — no camera, no studio, no experience required.
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-6 mb-8">
              {[
                ["12k+", "Products created"],
                ["15s", "Avg. generation"],
                ["98%", "Success rate"],
              ].map(([val, lbl]) => (
                <div key={lbl}>
                  <p className="text-sm font-black" style={{ color: W.text }}>
                    {val}
                  </p>
                  <p className="text-[10px]" style={{ color: W.dim }}>
                    {lbl}
                  </p>
                </div>
              ))}
            </div>

            {/* Newsletter */}
            <p
              className="text-[11px] font-bold uppercase tracking-widest mb-2.5"
              style={{ color: W.dim }}
            >
              Get tips &amp; updates
            </p>
            <form onSubmit={subscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 min-w-0 h-10 px-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: W.glassMid,
                  border: `1px solid ${W.border}`,
                  color: W.text,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(220,38,38,0.4)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(220,38,38,0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = W.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <motion.button
                whileTap={{ scale: 0.92 }}
                type="submit"
                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white transition-all"
                style={{
                  background: "#dc2626",
                  boxShadow: "0 0 12px rgba(220,38,38,0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 0 22px rgba(220,38,38,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 0 12px rgba(220,38,38,0.2)";
                }}
              >
                {done ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </motion.button>
            </form>
          </div>

          {/* ── Product links ──────────────────────────────────────── */}
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-widest mb-5"
              style={{ color: W.dim }}
            >
              Product
            </p>
            <ul className="space-y-3">
              {NAV.Product.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm transition-colors"
                    style={{ color: W.muted }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color =
                        W.text;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color =
                        W.muted;
                    }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Connect links ──────────────────────────────────────── */}
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-widest mb-5"
              style={{ color: W.dim }}
            >
              Connect
            </p>
            <ul className="space-y-3">
              {CONNECT.map(({ icon: Icon, label, href, highlight }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm transition-colors"
                    style={{ color: highlight ? W.red : W.muted }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color =
                        highlight ? "#fca5a5" : W.text;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color =
                        highlight ? W.red : W.muted;
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Legal links ────────────────────────────────────────── */}
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-widest mb-5"
              style={{ color: W.dim }}
            >
              Legal
            </p>
            <ul className="space-y-3">
              {NAV.Legal.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm transition-colors"
                    style={{ color: W.muted }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color =
                        W.text;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color =
                        W.muted;
                    }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ─────────────────────────────────────────────── */}
        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: `1px solid ${W.border}` }}
        >
          <p className="text-xs order-3 sm:order-1" style={{ color: W.dim }}>
            © {new Date().getFullYear()} OpusGen AI, Inc. All rights reserved.
          </p>

          <div className="flex items-center gap-1.5 order-1 sm:order-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            <p className="text-xs" style={{ color: W.dim }}>
              All systems operational
            </p>
          </div>

          <div className="flex items-center gap-5 order-2 sm:order-3">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Cookies", href: "/cookie-policy" },
              { label: "Refund", href: "/refund" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-xs transition-colors"
                style={{ color: W.dim }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = W.muted;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = W.dim;
                }}
              >
                {label}
              </Link>
            ))}
            <FeedbackButton variant="text" />
          </div>
        </div>
      </div>
    </footer>
  );
}
