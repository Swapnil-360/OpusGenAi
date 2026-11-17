"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ShoppingBag, Building2, Check, Loader2, AlertCircle } from "lucide-react";

interface ComingSoonCard {
  title: string;
  description: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}

const UPCOMING_CARDS: ComingSoonCard[] = [
  {
    badge: "Coming soon",
    title: "Creative Optimization Agent",
    description:
      "Learns which images and videos sell best, then creates new versions in the winning style.",
    icon: Sparkles,
  },
  {
    badge: "Coming soon",
    title: "Listing Agent",
    description:
      "Turns one raw product photo into a full listing: images, title and description.",
    icon: ShoppingBag,
  },
  {
    badge: "Coming soon",
    title: "For Agencies & Multi-SKU Brands",
    description:
      "Batch upload, team accounts and API for high-volume product imagery.",
    icon: Building2,
  },
];

export function ComingSoonSection() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Brand" | "Agency" | "Seller">("Brand");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTrimmed, role }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMessage(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSuccessMessage(
        data.message || "You're on the list. We'll email you when it's ready."
      );
      setEmail("");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="coming-soon"
      className="scroll-mt-20 py-14 md:py-24 px-4 sm:px-6 relative overflow-hidden"
      style={{
        background: "#080101",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Background ambient red glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] pointer-events-none rounded-full blur-[140px] opacity-15"
        style={{
          background: "radial-gradient(circle, #dc2626 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* ── Section Header ────────────────────────────────────────────── */}
        <motion.div
          className="mb-12 md:mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-[0.14em] uppercase mb-6"
            style={{
              background: "rgba(220,38,38,0.18)",
              border: "1px solid rgba(220,38,38,0.35)",
              color: "#fca5a5",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            Coming Soon
          </div>

          <h2
            className="font-black tracking-tight leading-[0.95] text-white"
            style={{ fontSize: "clamp(2.4rem,4.5vw,4.5rem)" }}
          >
            What&apos;s coming next
          </h2>
          <p
            className="mt-4 text-base sm:text-lg max-w-2xl leading-relaxed"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            Three new tools we&apos;re building. Join the waitlist to get early
            access.
          </p>
        </motion.div>

        {/* ── Feature Cards Grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-14 md:mb-20">
          {UPCOMING_CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.12,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="group relative rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-6">
                    {/* Badge */}
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase"
                      style={{
                        background: "rgba(220,38,38,0.12)",
                        border: "1px solid rgba(220,38,38,0.28)",
                        color: "#fca5a5",
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      {card.badge}
                    </span>

                    {/* Icon container */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.85)",
                      }}
                    >
                      <Icon className="w-5 h-5 text-red-400" />
                    </div>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-3 leading-snug">
                    {card.title}
                  </h3>

                  <p
                    className="text-sm sm:text-base leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.62)" }}
                  >
                    {card.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Waitlist Form Container ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-2xl mx-auto rounded-3xl p-6 sm:p-10 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(28,7,7,0.7) 0%, rgba(12,2,2,0.85) 100%)",
            border: "1px solid rgba(220,38,38,0.25)",
            boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div className="text-center mb-7">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Join the waitlist
            </h3>
          </div>

          <AnimatePresence mode="wait">
            {successMessage ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-6 px-4 text-center rounded-2xl flex flex-col items-center gap-3"
                style={{
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.28)",
                }}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <p className="text-base font-semibold text-emerald-300">
                  {successMessage}
                </p>
                <button
                  type="button"
                  onClick={() => setSuccessMessage(null)}
                  className="text-xs text-white/50 hover:text-white/80 transition-colors underline mt-1"
                >
                  Submit another email
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
                noValidate
              >
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                  {/* Email Field */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="waitlist-email"
                      className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2"
                    >
                      Email address
                    </label>
                    <input
                      id="waitlist-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="you@company.com"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 transition-all focus:outline-none"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#f87171";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 1px #f87171";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(255,255,255,0.12)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  {/* Dropdown Field */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="waitlist-role"
                      className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2"
                    >
                      I am a
                    </label>
                    <div className="relative">
                      <select
                        id="waitlist-role"
                        value={role}
                        onChange={(e) =>
                          setRole(
                            e.target.value as "Brand" | "Agency" | "Seller"
                          )
                        }
                        className="w-full px-4 py-3 rounded-xl text-sm text-white transition-all appearance-none cursor-pointer focus:outline-none"
                        style={{
                          background: "#180606",
                          border: "1px solid rgba(255,255,255,0.12)",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#f87171";
                          e.currentTarget.style.boxShadow =
                            "0 0 0 1px #f87171";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(255,255,255,0.12)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <option value="Brand" className="bg-[#150505] text-white">
                          Brand
                        </option>
                        <option value="Agency" className="bg-[#150505] text-white">
                          Agency
                        </option>
                        <option value="Seller" className="bg-[#150505] text-white">
                          Seller
                        </option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white/50">
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error message */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium text-red-200"
                    style={{
                      background: "rgba(220,38,38,0.15)",
                      border: "1px solid rgba(220,38,38,0.3)",
                    }}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 cursor-pointer disabled:opacity-50"
                  style={{
                    background:
                      "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.filter = "brightness(1.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = "none";
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Join the waitlist</span>
                  )}
                </button>

                {/* Note under button */}
                <p
                  className="text-center text-xs mt-3"
                  style={{ color: "rgba(255,255,255,0.42)" }}
                >
                  No spam. Only updates about these features.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

