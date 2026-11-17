"use client";

import { Sparkles, Layers, Sliders, Globe } from "lucide-react";
import {
  AmazonLogo,
  ShopifyLogo,
  InstagramLogo,
  TikTokLogo,
  EtsyLogo,
  EbayLogo,
  WalmartLogo,
  PinterestLogo,
} from "@/components/shared/PlatformLogos";

interface MultiPlatformBannerProps {
  userProductImage?: string | null;
}

const PLATFORMS = [
  { name: "Amazon", icon: AmazonLogo },
  { name: "Shopify", icon: ShopifyLogo },
  { name: "Instagram", icon: InstagramLogo },
  { name: "TikTok", icon: TikTokLogo },
  { name: "Etsy", icon: EtsyLogo },
  { name: "eBay", icon: EbayLogo },
  { name: "Walmart", icon: WalmartLogo },
  { name: "Pinterest", icon: PinterestLogo },
] as const;

const WORKFLOW_STEPS = [
  {
    icon: Layers,
    title: "Realistic Scene Blending",
    desc: "AI accurately matches reflections, lighting angles, and ground shadows to your product.",
  },
  {
    icon: Sliders,
    title: "Brand & Color Fidelity",
    desc: "Keeps your product label, typography, and original colors sharp and unaltered.",
  },
  {
    icon: Globe,
    title: "Multi-Platform Export",
    desc: "Production-grade assets optimized for e-commerce listings, banners, and social ads.",
  },
];

export function MultiPlatformBanner({}: MultiPlatformBannerProps = {}) {
  return (
    <div className="w-full space-y-3 mb-6">
      {/* Professional Studio Workflow Info Card (Replacing static image banner) */}
      <div
        className="relative w-full rounded-2xl p-4 sm:p-5 border overflow-hidden backdrop-blur-md"
        style={{
          background:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.035) 0%, rgba(18, 4, 4, 0.55) 100%)",
          borderColor: "rgba(255, 255, 255, 0.08)",
          boxShadow:
            "0 10px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        }}
      >
        {/* Subtle background red glow */}
        <div
          className="absolute -top-12 -right-12 w-64 h-64 rounded-full pointer-events-none opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, #dc2626 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        {/* Top Header */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
              style={{
                background: "rgba(220, 38, 38, 0.14)",
                border: "1px solid rgba(220, 38, 38, 0.3)",
                color: "#fca5a5",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              AI Studio Pipeline
            </span>
            <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
              Turn Raw Photos Into Production-Ready Visuals
            </span>
          </div>

          <div className="text-[11px] text-zinc-400 font-medium">
            Studio-quality scenes in seconds
          </div>
        </div>

        {/* 3-Column Professional Workflow Info */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {WORKFLOW_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="p-3 rounded-xl border flex items-start gap-2.5 transition-colors"
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  borderColor: "rgba(255, 255, 255, 0.06)",
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: "rgba(220, 38, 38, 0.1)",
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                  }}
                >
                  <Icon className="w-3.5 h-3.5 text-red-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white">
                    {step.title}
                  </div>
                  <div className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                    {step.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Production Ready Formats Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-0.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider shrink-0">
          <Sparkles className="w-3 h-3 text-red-500 shrink-0" />
          <span>Production ready formats for all platforms:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.name}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium text-zinc-300"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderColor: "rgba(255, 255, 255, 0.08)",
                }}
              >
                <Icon size={12} />
                <span>{p.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
