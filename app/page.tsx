"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useAnimationFrame,
  type MotionValue,
} from "framer-motion";
import { ArrowRight, Check, Sparkles, ArrowUpRight, Zap } from "lucide-react";
import { TOOLS } from "@/lib/tools-config";
import { PLANS, MOCK_CURRENT_USER, type Plan } from "@/lib/mock-data";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { SiteBanner } from "@/components/shared/SiteBanner";
import { cn } from "@/lib/utils";

// ─── Static data ─────────────────────────────────────────────────────────────

const HERO_STATS = [
  { value: "12k+", label: "Products created" },
  { value: "15s", label: "Avg. generation" },
  { value: "98%", label: "Success rate" },
  { value: "4K", label: "Max output" },
];

const CAPABILITIES = [
  "Product Photography",
  "Background Removal",
  "Background Replacement",
  "Image Cleanup",
  "4× Upscale",
  "Smart Uncrop",
  "Social Captions",
  "Hashtag Generation",
  "Brand Templates",
  "E-commerce Visuals",
  "Marketing Assets",
  "Campaign Creatives",
];

const TEMPLATES = [
  {
    name: "Luxury Product Shoot",
    category: "Photography",
    seed: "luxury-cosmetic",
    accent: "#dc2626",
  },
  {
    name: "White Studio Background",
    category: "Background",
    seed: "white-studio-2",
    accent: "#3b82f6",
  },
  {
    name: "Lifestyle Campaign",
    category: "Lifestyle",
    seed: "lifestyle-outdoor",
    accent: "#10b981",
  },
  {
    name: "Cosmetic Ad Creative",
    category: "Cosmetics",
    seed: "cosmetic-ad",
    accent: "#f59e0b",
  },
  {
    name: "Fashion Editorial",
    category: "Fashion",
    seed: "fashion-model",
    accent: "#8b5cf6",
  },
  {
    name: "Social Media Promo",
    category: "Social",
    seed: "social-promo-2",
    accent: "#ec4899",
  },
];

const HERO_IMAGES = [
  {
    src: "https://picsum.photos/seed/heroprod1/280/380",
    alt: "Studio product",
    rotation: -14,
  },
  {
    src: "https://picsum.photos/seed/heroprod2/280/380",
    alt: "Cosmetic campaign",
    rotation: 6,
  },
  {
    src: "https://picsum.photos/seed/heroprod3/280/380",
    alt: "Fashion shoot",
    rotation: -9,
  },
  {
    src: "https://picsum.photos/seed/heroprod4/280/380",
    alt: "E-commerce visual",
    rotation: 13,
  },
  {
    src: "https://picsum.photos/seed/heroprod5/280/380",
    alt: "Luxury product",
    rotation: -11,
  },
  {
    src: "https://picsum.photos/seed/heroprod6/280/380",
    alt: "Brand creative",
    rotation: 5,
  },
  {
    src: "https://picsum.photos/seed/heroprod7/280/380",
    alt: "Social media asset",
    rotation: -7,
  },
  {
    src: "https://picsum.photos/seed/heroprod8/280/380",
    alt: "Marketing visual",
    rotation: 10,
  },
];

// ─── Helper components ───────────────────────────────────────────────────────

function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-[0.14em] uppercase mb-6"
      style={{
        background: "rgba(220,38,38,0.1)",
        border: "1px solid rgba(220,38,38,0.25)",
        color: "rgba(248,113,113,1)",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"
        style={{ animationDuration: "2s" }}
      />
      {children}
    </div>
  );
}

function TiltCard({
  children,
  className,
  style,
  intensity = 8,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(
    useTransform(y, [-0.5, 0.5], [intensity, -intensity]),
    { stiffness: 200, damping: 22 },
  );
  const rotateY = useSpring(
    useTransform(x, [-0.5, 0.5], [-intensity, intensity]),
    { stiffness: 200, damping: 22 },
  );

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 900, ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SpinBorder({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={cn("relative rounded-2xl overflow-hidden group/spin", className)}
      style={{ padding: "1.5px" }}
      whileHover={{
        boxShadow: "0 0 28px rgba(220,38,38,0.35), 0 0 60px rgba(220,38,38,0.12)",
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Base slot fill */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(180,18,18,0.38)" }}
      />
      {/* Spinning gradient — wide bright arcs */}
      <motion.div
        className="absolute"
        style={{
          width: "200%",
          height: "200%",
          top: "-50%",
          left: "-50%",
          willChange: "transform",
          background:
            "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(251,113,133,0.55) 18deg, rgba(239,68,68,1) 48deg, rgba(251,146,60,0.85) 72deg, rgba(239,68,68,0.55) 96deg, transparent 136deg, transparent 230deg, rgba(220,38,38,0.95) 278deg, rgba(251,113,133,0.45) 308deg, transparent 340deg)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
      />
      {/* Content layer */}
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: "calc(1rem - 1.5px)",
          background: "linear-gradient(160deg, #130505 0%, #0a0202 100%)",
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}

// ─── Orbital card ────────────────────────────────────────────────────────────

function OrbitCard({
  src,
  alt,
  rotation,
  orbitAngle,
  offset,
  radius = 180,
}: {
  src: string;
  alt: string;
  rotation: number;
  orbitAngle: MotionValue<number>;
  offset: number;
  radius?: number;
}) {
  const x = useTransform(
    orbitAngle,
    (a) => Math.cos(((a + offset) * Math.PI) / 180) * radius,
  );
  const y = useTransform(
    orbitAngle,
    (a) => Math.sin(((a + offset) * Math.PI) / 180) * radius,
  );

  return (
    <motion.div
      className="absolute w-32 h-36 rounded-2xl overflow-hidden cursor-pointer"
      style={{
        left: "50%",
        top: "50%",
        marginLeft: -64,
        marginTop: -72,
        x,
        y,
        rotate: rotation,
        boxShadow:
          "0 14px 44px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.07), 0 0 18px rgba(180,10,10,0.1)",
      }}
      whileHover={{
        scale: 1.14,
        zIndex: 10,
        boxShadow:
          "0 20px 60px rgba(0,0,0,0.85), 0 0 0 2px rgba(220,38,38,0.65), 0 0 32px rgba(220,38,38,0.3)",
      }}
      transition={{ type: "spring", stiffness: 340, damping: 22 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full h-full object-cover" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 45%, rgba(5,1,1,0.5) 100%)",
        }}
      />
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 55%)",
        }}
      />
    </motion.div>
  );
}

// ─── Pricing card ─────────────────────────────────────────────────────────────

function PricingCard({ plan, isCurrent }: { plan: Plan; isCurrent: boolean }) {
  const isBasic = plan.id === "basic";
  const isPro = plan.highlight;

  // per-tier accent colors
  const A = isPro
    ? { bg: "rgba(220,38,38,0.15)", border: "rgba(220,38,38,0.3)", text: "#f87171", line: "rgba(220,38,38,0.5)" }
    : isBasic
    ? { bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.3)", text: "#38bdf8", line: "rgba(56,189,248,0.5)" }
    : { bg: "transparent", border: "rgba(255,255,255,0.07)", text: "rgba(255,255,255,0.35)", line: "transparent" };

  const cardBg = isPro
    ? "linear-gradient(160deg, rgba(180,15,15,0.16) 0%, rgba(8,2,2,0.98) 55%)"
    : isBasic
    ? "linear-gradient(160deg, rgba(56,189,248,0.1) 0%, rgba(8,2,2,0.98) 55%)"
    : "rgba(255,255,255,0.02)";

  const savings = plan.originalPrice ? plan.originalPrice - plan.price : 0;
  const G = { bg: "rgba(34,197,94,0.14)", border: "rgba(34,197,94,0.35)", text: "#4ade80", line: "rgba(34,197,94,0.5)" };

  const inner = (
    <div className="relative overflow-hidden" style={{ background: cardBg }}>
      {/* Top accent line — green takes priority when current */}
      {(isPro || isBasic || isCurrent) && (
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: `linear-gradient(to right, transparent, ${isCurrent ? G.line : A.line}, transparent)` }}
        />
      )}

      <div className="p-7 flex flex-col">
        {/* Badge — "Current plan" overrides tier badge */}
        {isCurrent ? (
          <span
            className="self-start mb-5 text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1 flex items-center gap-1.5"
            style={{ background: G.bg, border: `1px solid ${G.border}`, color: G.text }}
          >
            <Check className="w-3 h-3" />Current plan
          </span>
        ) : isPro ? (
          <span
            className="self-start mb-5 text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1"
            style={{ background: A.bg, border: `1px solid ${A.border}`, color: A.text }}
          >
            Most popular
          </span>
        ) : isBasic ? (
          <span
            className="self-start mb-5 text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1"
            style={{ background: A.bg, border: `1px solid ${A.border}`, color: A.text }}
          >
            Best value
          </span>
        ) : null}

        {/* Price */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.38)" }}>
            {plan.name}
          </p>

          {/* Original / discounted */}
          {plan.originalPrice && (
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm line-through" style={{ color: "rgba(255,255,255,0.25)" }}>
                ${plan.originalPrice}/mo
              </span>
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }}
              >
                Save ${savings}
              </span>
            </div>
          )}

          <div className="flex items-end gap-1">
            <p className="text-5xl font-black leading-none">
              {plan.price === 0 ? "Free" : `$${plan.price}`}
            </p>
            {plan.price > 0 && (
              <span className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.28)" }}>/mo</span>
            )}
          </div>
          <p className="text-xs font-medium mt-2" style={{ color: `${A.text}88` }}>
            {plan.credits} credits included
          </p>
        </div>

        {/* Features */}
        <ul className="space-y-2.5 mb-7 flex-1">
          {plan.features.slice(0, isPro ? 5 : 4).map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.48)" }}>
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{ background: A.bg, border: `1px solid ${A.border}` }}
              >
                <Check className="w-2.5 h-2.5" style={{ color: A.text }} />
              </div>
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        {isCurrent ? (
          <div
            className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-default"
            style={{ border: `1px solid ${G.border}`, background: G.bg, color: G.text }}
          >
            <Check className="w-4 h-4" />Active plan
          </div>
        ) : (
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: isPro ? "0 0 32px rgba(220,38,38,0.4)" : isBasic ? "0 0 32px rgba(56,189,248,0.4)" : "none" }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-11 rounded-xl text-sm font-bold transition-all"
              style={
                isPro
                  ? { background: "#dc2626", color: "#fff", boxShadow: "0 0 20px rgba(220,38,38,0.28)" }
                  : isBasic
                  ? { background: "#0ea5e9", color: "#fff", boxShadow: "0 0 20px rgba(56,189,248,0.25)" }
                  : { border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)" }
              }
            >
              {plan.cta}
            </motion.button>
          </Link>
        )}
      </div>
    </div>
  );

  if (isPro) {
    return (
      <TiltCard intensity={5}>
        <SpinBorder>{inner}</SpinBorder>
      </TiltCard>
    );
  }

  return (
    <TiltCard intensity={4}>
      <div
        className="relative rounded-2xl overflow-hidden"
        style={
          isCurrent
            ? { border: `1px solid ${G.border}`, boxShadow: "0 0 28px rgba(34,197,94,0.12)" }
            : isBasic
            ? { border: `1px solid ${A.border}`, boxShadow: "0 0 28px rgba(56,189,248,0.1)" }
            : { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }
        }
      >
        {inner}
      </div>
    </TiltCard>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const orbitAngle = useMotionValue(0);
  useAnimationFrame((t) => {
    orbitAngle.set((t * 0.015) % 360);
  });

  return (
    <div className="text-white" style={{ background: "#0f0404" }}>
      {/* Fixed atmospheric background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          background: `
            radial-gradient(ellipse at 65% 0%, rgba(160,14,14,0.38) 0%, transparent 52%),
            radial-gradient(ellipse at 8% 55%, rgba(110,8,8,0.22) 0%, transparent 44%),
            radial-gradient(ellipse at 92% 88%, rgba(120,8,8,0.16) 0%, transparent 40%)
          `,
        }}
      />

      <div className="relative" style={{ zIndex: 1 }}>
        <SiteBanner />
        <LandingNav />

        {/* ══ HERO ════════════════════════════════════════════════════════════ */}
        <section className="relative lg:min-h-screen flex items-start md:items-center overflow-hidden">
          {/* Grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)",
              backgroundSize: "72px 72px",
            }}
          />

          {/* Red ambient glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              right: "5%",
              top: "50%",
              transform: "translateY(-50%)",
              width: "900px",
              height: "900px",
              background:
                "radial-gradient(ellipse at center, rgba(210,22,22,0.32) 0%, rgba(180,10,10,0.1) 45%, transparent 70%)",
              filter: "blur(90px)",
            }}
          />

          <div className="relative max-w-7xl mx-auto w-full px-5 sm:px-6 grid grid-cols-1 lg:grid-cols-[1fr_500px] xl:grid-cols-[1fr_560px] gap-8 lg:gap-12 xl:gap-16 items-center pt-20 pb-6 md:pt-24 md:pb-10 lg:py-20">
            {/* Left: copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <SectionLabel>AI Creative Studio</SectionLabel>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.08 }}
                className="font-black tracking-tight leading-[0.9] mb-5 sm:mb-7 text-center lg:text-left"
                style={{ fontSize: "clamp(2.6rem,5.5vw,5.8rem)" }}
              >
                Where Great
                <br />
                Products
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(130deg, #f87171 0%, #ef4444 35%, #b91c1c 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Meet Great Visuals
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.24 }}
                className="leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0 text-center lg:text-left"
                style={{ fontSize: "1rem", color: "rgba(255,255,255,0.5)" }}
              >
                Turn any product photo into studio-quality marketing visuals —
                in seconds.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className="flex items-center gap-3 flex-wrap justify-center lg:justify-start"
              >
                <Link href="/signup">
                  <motion.button
                    whileHover={{
                      scale: 1.04,
                      boxShadow: "0 0 56px rgba(220,38,38,0.55)",
                    }}
                    whileTap={{ scale: 0.97 }}
                    className="group flex items-center gap-3 h-13 pl-6 pr-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold transition-all text-[15px]"
                    style={{ boxShadow: "0 0 32px rgba(220,38,38,0.32)" }}
                  >
                    Get Started
                    <span className="flex items-center justify-center w-9 h-9 rounded-full transition-colors" style={{ background: "rgba(255,255,255,0.18)" }}>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </motion.button>
                </Link>
                <Link href="#templates">
                  <motion.button
                    whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.22)" }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2.5 h-13 px-6 rounded-full font-medium transition-all text-[15px]"
                    style={{
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.05)",
                      color: "rgba(255,255,255,0.75)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    Explore Templates
                  </motion.button>
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.42 }}
                className="text-xs mt-4 text-center lg:text-left"
                style={{ color: "rgba(255,255,255,0.22)" }}
              >
                10 free credits · No card required
              </motion.p>
            </div>

            {/* Right: orbital image carousel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 1.1,
                delay: 0.18,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="relative flex items-center justify-center"
            >
              {/* Responsive container — clips/scales the 480×480 orbital */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-[480px] lg:h-[480px]">
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.53] sm:scale-[0.67] lg:scale-100 origin-center"
                style={{ width: 480, height: 480 }}
              >
                {/* Radial ambient glow */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at center, rgba(210,22,22,0.42) 0%, rgba(160,8,8,0.14) 40%, transparent 70%)",
                    filter: "blur(55px)",
                  }}
                />

                {/* Subtle orbit ring */}
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: 356,
                    height: 356,
                    left: "50%",
                    top: "50%",
                    marginLeft: -178,
                    marginTop: -178,
                    border: "1px solid rgba(220,38,38,0.09)",
                  }}
                />

                {/* Orbiting cards */}
                {HERO_IMAGES.map((img, i) => (
                  <OrbitCard
                    key={i}
                    src={img.src}
                    alt={img.alt}
                    rotation={img.rotation}
                    orbitAngle={orbitAngle}
                    offset={(i * 360) / HERO_IMAGES.length}
                  />
                ))}

                {/* Center branding */}
                <motion.div
                  className="absolute z-20 flex items-center justify-center rounded-full cursor-pointer"
                  style={{
                    width: 96,
                    height: 96,
                    left: "50%",
                    top: "50%",
                    marginLeft: -48,
                    marginTop: -48,
                  }}
                  whileHover={{
                    scale: 1.18,
                    filter: "drop-shadow(0 0 18px rgba(251,146,60,0.7)) drop-shadow(0 0 36px rgba(220,38,38,0.4))",
                  }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo/OpusGenAi(white).png" alt="OpusGen AI" className="w-24 h-auto object-contain" />
                </motion.div>
              </div>
              </div>{/* end responsive container */}
            </motion.div>
          </div>
        </section>

        {/* ══ MARQUEE ══════════════════════════════════════════════════════════ */}
        <div
          className="relative overflow-hidden"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-28 pointer-events-none z-10"
            style={{
              background: "linear-gradient(to right, #0f0404, transparent)",
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-28 pointer-events-none z-10"
            style={{
              background: "linear-gradient(to left, #0f0404, transparent)",
            }}
          />
          <motion.div
            className="flex whitespace-nowrap"
            animate={{ x: "-50%" }}
            transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
          >
            {[...CAPABILITIES, ...CAPABILITIES].map((cap, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-6 py-5 shrink-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-700 shrink-0" />
                <span
                  className="text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  {cap}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ══ TOOLS ════════════════════════════════════════════════════════════ */}
        <section id="tools" className="py-14 md:py-24 lg:py-28 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 md:mb-16">
                <div>
                  <SectionLabel>The Toolbox</SectionLabel>
                  <h2
                    className="font-black tracking-tight leading-[0.9]"
                    style={{ fontSize: "clamp(2.4rem,4.5vw,5rem)" }}
                  >
                    Six precision
                    <br />
                    <span
                      style={{
                        color: "rgba(255,255,255,0.2)",
                        fontWeight: 300,
                      }}
                    >
                      tools, one platform
                    </span>
                  </h2>
                </div>
                <Link
                  href="/signup"
                  className="flex items-center gap-1.5 text-sm font-medium shrink-0 pb-1 group transition-colors"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "rgba(248,113,113,1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.35)")
                  }
                >
                  All tools free to start
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TOOLS.map((tool, i) => (
                <FadeIn key={tool.id} delay={i * 0.07}>
                  <Link href={tool.href} className="block h-full">
                    {/* Outer: handles lift + outer glow — no overflow-hidden so shadow is visible */}
                    <motion.div
                      className="group relative rounded-2xl h-full cursor-pointer"
                      whileHover={{
                        y: -6,
                        boxShadow: `0 0 0 1px ${tool.accentColor}90, 0 16px 48px rgba(0,0,0,0.6), 0 0 80px ${tool.accentColor}28`,
                      }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                    >
                      {/* Spinning border layer — overflow-hidden clips the conic gradient to rounded corners */}
                      <div
                        className="relative rounded-2xl overflow-hidden h-full"
                        style={{ padding: "1.5px" }}
                      >
                        {/* Static dim base so the "off" part of the spin isn't transparent */}
                        <div
                          className="absolute inset-0 rounded-2xl"
                          style={{ background: `${tool.accentColor}28` }}
                        />
                        {/* Spinning conic gradient — accent-colored bright arc */}
                        <motion.div
                          className="absolute rounded-2xl"
                          style={{
                            width: "200%",
                            height: "200%",
                            top: "-50%",
                            left: "-50%",
                            willChange: "transform",
                            background: `conic-gradient(from 0deg at 50% 50%,
                              transparent 0deg,
                              ${tool.accentColor}44 20deg,
                              ${tool.accentColor}cc 48deg,
                              ${tool.accentColor}ff 60deg,
                              ${tool.accentColor}cc 72deg,
                              ${tool.accentColor}44 92deg,
                              transparent 130deg,
                              transparent 240deg,
                              ${tool.accentColor}66 285deg,
                              ${tool.accentColor}44 310deg,
                              transparent 340deg
                            )`,
                          }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        />

                        {/* Content — clips image/info to inner radius */}
                        <div
                          className="relative flex flex-col h-full overflow-hidden"
                          style={{
                            borderRadius: "calc(1rem - 1.5px)",
                            background: "#0d0303",
                          }}
                        >
                          {/* Image */}
                          <div className="relative overflow-hidden shrink-0" style={{ aspectRatio: "16/9" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={tool.cardImage}
                              alt={tool.label}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.07]"
                            />
                            {/* Bottom fade */}
                            <div
                              className="absolute inset-0"
                              style={{
                                background:
                                  "linear-gradient(to top, rgba(13,3,3,0.94) 0%, rgba(13,3,3,0.3) 45%, transparent 100%)",
                              }}
                            />
                            {/* Accent tint on hover */}
                            <div
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              style={{ background: `linear-gradient(135deg, ${tool.accentColor}1a 0%, transparent 55%)` }}
                            />
                            {/* Badge */}
                            {tool.badge && (
                              <div className="absolute top-2.5 left-2.5">
                                <span
                                  className="text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm"
                                  style={{
                                    background: "rgba(220,38,38,0.9)",
                                    color: "#fff",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                  }}
                                >
                                  {tool.badge}
                                </span>
                              </div>
                            )}
                            {/* Credits */}
                            <div className="absolute top-2.5 right-2.5">
                              <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1"
                                style={{
                                  background: "rgba(0,0,0,0.65)",
                                  color: "rgba(255,255,255,0.85)",
                                  border: "1px solid rgba(255,255,255,0.12)",
                                }}
                              >
                                <Zap className="w-2.5 h-2.5" style={{ color: tool.accentColor }} />
                                {tool.creditCost}cr
                              </span>
                            </div>
                          </div>

                          {/* Info */}
                          <div className="px-4 pt-3.5 pb-4 flex flex-col flex-1">
                            <div className="flex items-center gap-2.5 mb-2">
                              <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                                style={{
                                  background: `${tool.accentColor}22`,
                                  border: `1px solid ${tool.accentColor}40`,
                                }}
                              >
                                <Sparkles className="w-3 h-3" style={{ color: tool.accentColor }} />
                              </div>
                              <h3
                                className="font-bold text-[14px] leading-tight flex-1"
                                style={{ color: "rgba(255,255,255,0.95)" }}
                              >
                                {tool.label}
                              </h3>
                              <ArrowUpRight
                                className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                style={{ color: tool.accentColor }}
                              />
                            </div>
                            <p
                              className="text-xs leading-relaxed line-clamp-2"
                              style={{ color: "rgba(255,255,255,0.58)" }}
                            >
                              {tool.description}
                            </p>
                            {/* Bottom accent line on hover */}
                            <div
                              className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              style={{ background: `linear-gradient(to right, transparent, ${tool.accentColor}80, transparent)` }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TEMPLATES ════════════════════════════════════════════════════════ */}
        <section
          id="templates"
          className="py-14 md:py-24 lg:py-28 px-4 sm:px-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="max-w-7xl mx-auto">
            <FadeIn className="mb-10 md:mb-16">
              <SectionLabel>Template Marketplace</SectionLabel>
              <h2
                className="font-black tracking-tight leading-[0.9]"
                style={{ fontSize: "clamp(2.4rem,4.5vw,5rem)" }}
              >
                Premium templates
                <br />
                <span
                  style={{ color: "rgba(255,255,255,0.2)", fontWeight: 300 }}
                >
                  built to convert
                </span>
              </h2>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEMPLATES.map((tmpl, i) => (
                <FadeIn key={tmpl.name} delay={i * 0.06}>
                  <Link href="/templates">
                    <TiltCard intensity={5} className="cursor-pointer">
                      <SpinBorder>
                        <div
                          className="group relative"
                          style={{ aspectRatio: "4/3" }}
                        >
                          {/* Image */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://picsum.photos/seed/${tmpl.seed}/480/360`}
                            alt={tmpl.name}
                            className="w-full h-full object-cover"
                            style={{ transition: "transform 0.8s ease" }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.transform = "scale(1.08)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.transform = "scale(1)")
                            }
                          />
                          <div
                            className="absolute inset-0"
                            style={{
                              background:
                                "linear-gradient(to top, rgba(3,3,3,0.85) 0%, rgba(3,3,3,0.12) 50%, transparent 100%)",
                            }}
                          />
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                            style={{
                              background: `linear-gradient(135deg, ${tmpl.accent}1a 0%, transparent 55%)`,
                            }}
                          />

                          {/* Info overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-5">
                            <span
                              className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2.5"
                              style={{
                                background: `${tmpl.accent}1a`,
                                border: `1px solid ${tmpl.accent}35`,
                                color: tmpl.accent,
                              }}
                            >
                              {tmpl.category}
                            </span>
                            <p className="font-bold text-[15px] text-white">
                              {tmpl.name}
                            </p>
                          </div>

                          {/* Arrow */}
                          <div
                            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                            style={{ background: "rgba(255,255,255,0.12)" }}
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </SpinBorder>
                    </TiltCard>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══ STATS BAR ════════════════════════════════════════════════════════ */}
        <div
          className="py-10 md:py-16 px-4 sm:px-6"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
            {HERO_STATS.map(({ value, label }, i) => (
              <FadeIn key={label} delay={i * 0.08}>
                <div className="text-center">
                  <p className="text-4xl sm:text-5xl font-black tabular-nums">
                    {value}
                  </p>
                  <p
                    className="text-xs mt-2 font-medium"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    {label}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>

        {/* ══ PRICING ══════════════════════════════════════════════════════════ */}
        <section id="pricing" className="py-14 md:py-24 lg:py-28 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <FadeIn className="mb-10 md:mb-16">
              <SectionLabel>Pricing</SectionLabel>
              <h2
                className="font-black tracking-tight leading-[0.9]"
                style={{ fontSize: "clamp(2.4rem,4.5vw,5rem)" }}
              >
                Simple pricing
                <br />
                <span
                  style={{ color: "rgba(255,255,255,0.2)", fontWeight: 300 }}
                >
                  no surprises
                </span>
              </h2>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              {PLANS.map((plan, i) => (
                <FadeIn
                  key={plan.id}
                  delay={i * 0.09}
                  className={plan.highlight ? "sm:-my-8" : plan.id === "basic" ? "sm:-my-4" : ""}
                >
                  <PricingCard plan={plan} isCurrent={plan.id === MOCK_CURRENT_USER.plan} />
                </FadeIn>
              ))}
            </div>
            <p
              className="text-center text-xs mt-8"
              style={{ color: "rgba(255,255,255,0.18)" }}
            >
              All 6 tools · All templates · Credits never expire
            </p>
          </div>
        </section>

        {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
        <LandingFooter />
      </div>
    </div>
  );
}
