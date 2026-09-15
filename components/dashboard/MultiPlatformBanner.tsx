"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronDown, Sparkles } from "lucide-react";
import {
  AmazonLogo,
  ShopifyLogo,
  InstagramLogo,
  TikTokLogo,
  EtsyLogo,
  EbayLogo,
  WalmartLogo,
  PinterestLogo,
  FacebookLogo,
} from "@/components/shared/PlatformLogos";

interface MultiPlatformBannerProps {
  userProductImage?: string | null;
}

const OUTPUT_FORMATS = [
  {
    id: "square",
    ratio: "1:1",
    resolution: "2048 × 2048",
    label: "Marketplace Listing",
    useCase: "Amazon & Shopify",
    aspectBoxClass: "aspect-square w-16 sm:w-20",
    platforms: [
      { name: "Amazon", icon: AmazonLogo },
      { name: "Shopify", icon: ShopifyLogo },
    ],
    desc: "Studio lighting & reflections",
  },
  {
    id: "story",
    ratio: "9:16",
    resolution: "1080 × 1920",
    label: "Stories & Reels",
    useCase: "TikTok & Instagram",
    aspectBoxClass: "aspect-[9/16] w-10 sm:w-12",
    platforms: [
      { name: "TikTok", icon: TikTokLogo },
      { name: "Instagram", icon: InstagramLogo },
    ],
    desc: "Mobile fullscreen lifestyle",
  },
  {
    id: "banner",
    ratio: "16:9",
    resolution: "1920 × 1080",
    label: "Storefront Banner",
    useCase: "Shopify Hero & Web",
    aspectBoxClass: "aspect-[16/9] w-20 sm:w-24",
    platforms: [
      { name: "Shopify", icon: ShopifyLogo },
      { name: "Facebook", icon: FacebookLogo },
    ],
    desc: "Panoramic copy-safe space",
  },
  {
    id: "portrait",
    ratio: "3:4",
    resolution: "1200 × 1600",
    label: "Catalog & Pin",
    useCase: "Etsy & Pinterest",
    aspectBoxClass: "aspect-[3/4] w-12 sm:w-14",
    platforms: [
      { name: "Etsy", icon: EtsyLogo },
      { name: "Pinterest", icon: PinterestLogo },
    ],
    desc: "Vertical discovery feeds",
  },
] as const;

export function MultiPlatformBanner({ userProductImage }: MultiPlatformBannerProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("opusgen:multi_platform_banner_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {
      // ignore
    }
    setHasLoaded(true);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("opusgen:multi_platform_banner_collapsed", String(next));
    } catch {
      // ignore
    }
  };

  if (!hasLoaded) return null;

  const rawImageSrc = userProductImage || "/tools/remove-bg.jpg";
  const sceneImageSrc = "/tools/replace-bg.jpg";

  return (
    <div
      className="rounded-2xl border transition-all overflow-hidden"
      style={{
        background:
          "linear-gradient(145deg, rgba(24, 7, 7, 0.95) 0%, rgba(13, 3, 3, 0.98) 100%)",
        borderColor: "rgba(239, 68, 68, 0.22)",
        boxShadow: "0 12px 36px rgba(0, 0, 0, 0.45)",
      }}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
            }}
          >
            <Zap className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                Multi-Platform Production Workflow
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#fca5a5",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                1 Photo ➔ All Platforms
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block truncate mt-0.5">
              Turn one normal product photo into production-ready images formatted for any channel.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleCollapse}
          className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/5 transition-colors shrink-0 ml-2"
          title={collapsed ? "Show visual workflow banner" : "Hide banner"}
        >
          <span>{collapsed ? "Show Workflow" : "Hide"}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${
              collapsed ? "" : "rotate-180"
            }`}
          />
        </button>
      </div>

      {/* Expandable Visual Workflow Banner */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div
              className="px-4 pb-5 pt-3 sm:px-6 sm:pb-6 border-t"
              style={{ borderColor: "rgba(255, 255, 255, 0.07)" }}
            >
              {/* Visual Transformation Diagram with Branching Arrows */}
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6 pt-1">
                {/* 1. Source: Normal Photo */}
                <div className="flex flex-col items-center text-center shrink-0">
                  <div
                    className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border p-2 flex items-center justify-center shadow-lg"
                    style={{
                      background: "rgba(0, 0, 0, 0.5)",
                      borderColor: "rgba(255, 255, 255, 0.12)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rawImageSrc}
                      alt="Normal product photo"
                      className="w-full h-full object-contain drop-shadow-md"
                    />
                    <span className="absolute top-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/85 text-zinc-300 border border-white/10 uppercase tracking-wide">
                      Normal Photo
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white mt-2">
                    Raw Product Photo
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    Works with any clean photo
                  </p>
                </div>

                {/* 2. Curved Branching Arrow Graphic */}
                <div className="hidden lg:flex flex-col items-center justify-center shrink-0 px-2">
                  <svg
                    width="60"
                    height="80"
                    viewBox="0 0 60 80"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-red-500/85"
                  >
                    {/* Top branch */}
                    <path
                      d="M4 40C20 40 28 16 54 16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />
                    <polygon points="52,12 58,16 52,20" fill="currentColor" />

                    {/* Middle branch */}
                    <path
                      d="M4 40H54"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />
                    <polygon points="52,36 58,40 52,44" fill="currentColor" />

                    {/* Bottom branch */}
                    <path
                      d="M4 40C20 40 28 64 54 64"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />
                    <polygon points="52,60 58,64 52,68" fill="currentColor" />
                  </svg>
                  <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest text-center mt-1">
                    AI Transforms
                  </span>
                </div>

                {/* Mobile Flow Indicator */}
                <div className="flex lg:hidden items-center justify-center gap-2 py-0.5 text-red-400 text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Transforms To Production Ready Outputs</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="rotate-90"
                  >
                    <path
                      d="M2 6H10M10 6L6 2M10 6L6 10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* 3. Production Ready Outputs Display */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 flex-1 w-full">
                  {OUTPUT_FORMATS.map((fmt) => (
                    <div
                      key={fmt.id}
                      className="flex flex-col p-2.5 rounded-xl border text-left"
                      style={{
                        background: "rgba(255, 255, 255, 0.025)",
                        borderColor: "rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      {/* Formatted Ratio Scene Preview Box */}
                      <div className="relative w-full h-20 sm:h-22 rounded-lg overflow-hidden bg-black/60 border border-white/10 mb-2 flex items-center justify-center">
                        <div
                          className={`relative rounded overflow-hidden border border-white/20 shadow-md ${fmt.aspectBoxClass}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sceneImageSrc}
                            alt={fmt.label}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Aspect Ratio Tag */}
                        <span className="absolute top-1.5 right-1.5 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/85 text-zinc-200 border border-white/10">
                          {fmt.ratio}
                        </span>
                      </div>

                      {/* Header & Subtitle */}
                      <p className="text-xs font-bold text-white truncate leading-tight">
                        {fmt.label}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5 truncate font-medium">
                        {fmt.useCase}
                      </p>

                      {/* Platform Logos & Resolution Footer */}
                      <div
                        className="pt-2 mt-2 border-t flex items-center justify-between text-[9px]"
                        style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
                      >
                        <div className="flex items-center -space-x-1">
                          {fmt.platforms.map((p) => {
                            const Icon = p.icon;
                            return (
                              <div
                                key={p.name}
                                className="w-4 h-4 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center shrink-0"
                                title={p.name}
                              >
                                <Icon size={10} />
                              </div>
                            );
                          })}
                        </div>
                        <span className="font-mono text-zinc-400 text-[9px]">
                          {fmt.resolution}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Platform Compatibility Strip */}
              <div
                className="mt-4 pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
              >
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Suitable for all marketplaces, platforms &amp; channels:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { name: "Amazon", icon: AmazonLogo },
                    { name: "Shopify", icon: ShopifyLogo },
                    { name: "Instagram", icon: InstagramLogo },
                    { name: "TikTok", icon: TikTokLogo },
                    { name: "Etsy", icon: EtsyLogo },
                    { name: "eBay", icon: EbayLogo },
                    { name: "Walmart", icon: WalmartLogo },
                    { name: "Pinterest", icon: PinterestLogo },
                  ].map((p) => {
                    const Icon = p.icon;
                    return (
                      <div
                        key={p.name}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] text-zinc-300"
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          borderColor: "rgba(255, 255, 255, 0.07)",
                        }}
                      >
                        <Icon size={11} />
                        <span className="hidden sm:inline">{p.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
