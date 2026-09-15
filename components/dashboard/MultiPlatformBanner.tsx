"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ChevronDown,
  ArrowRight,
  Check,
  Zap,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  AmazonLogo,
  ShopifyLogo,
  InstagramLogo,
  TikTokLogo,
  EtsyLogo,
  EbayLogo,
  FacebookLogo,
  PinterestLogo,
} from "@/components/shared/PlatformLogos";

interface MultiPlatformBannerProps {
  currentRatio: string;
  onSelectRatio: (ratio: string) => void;
}

const PRODUCTION_FORMATS = [
  {
    id: "square",
    ratio: "1:1",
    label: "Marketplace Listing",
    platforms: [
      { name: "Amazon", icon: AmazonLogo },
      { name: "Shopify", icon: ShopifyLogo },
      { name: "Instagram", icon: InstagramLogo },
    ],
    resolution: "2048 × 2048 px",
    desc: "Clean studio backdrop, spotlight reflections, 85% subject frame rule compliant.",
    highlight: "Highest Marketplace Conversion",
  },
  {
    id: "story",
    ratio: "9:16",
    label: "Vertical Story & Reels",
    platforms: [
      { name: "TikTok", icon: TikTokLogo },
      { name: "Instagram", icon: InstagramLogo },
      { name: "Facebook", icon: FacebookLogo },
    ],
    resolution: "1080 × 1920 px",
    desc: "Immersive mobile fullscreen for viral TikTok shop, Instagram Stories & Reels.",
    highlight: "Mobile Viral Engagement",
  },
  {
    id: "banner",
    ratio: "16:9",
    label: "E-Commerce Hero Banner",
    platforms: [
      { name: "Shopify", icon: ShopifyLogo },
      { name: "Facebook", icon: FacebookLogo },
      { name: "Amazon", icon: AmazonLogo },
    ],
    resolution: "1920 × 1080 px",
    desc: "Cinematic wide-angle view with safe margins for promotional headlines & CTAs.",
    highlight: "Storefront Headers & Ads",
  },
  {
    id: "portrait",
    ratio: "3:4",
    label: "Catalog & Pin Lookbook",
    platforms: [
      { name: "Etsy", icon: EtsyLogo },
      { name: "Pinterest", icon: PinterestLogo },
      { name: "eBay", icon: EbayLogo },
    ],
    resolution: "1200 × 1600 px",
    desc: "Vertical catalog presentation with rich aesthetic styling for high click-through.",
    highlight: "Handmade & Discovery Feeds",
  },
] as const;

export function MultiPlatformBanner({
  currentRatio,
  onSelectRatio,
}: MultiPlatformBannerProps) {
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
      localStorage.setItem(
        "opusgen:multi_platform_banner_collapsed",
        String(next),
      );
    } catch {
      // ignore
    }
  };

  if (!hasLoaded) return null;

  return (
    <div
      className="rounded-2xl border transition-all overflow-hidden"
      style={{
        background:
          "linear-gradient(145deg, rgba(22, 6, 6, 0.88) 0%, rgba(13, 3, 3, 0.95) 100%)",
        borderColor: "rgba(239, 68, 68, 0.22)",
        boxShadow: "0 12px 36px rgba(0, 0, 0, 0.45)",
      }}
    >
      {/* Top bar */}
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
                Multi-Platform Production Ready
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#fca5a5",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                Amazon · Shopify · TikTok · Etsy
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block truncate mt-0.5">
              Transform one product photo into platform-compliant visuals in any aspect ratio.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleCollapse}
          className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors shrink-0 ml-2"
          title={collapsed ? "Expand production details" : "Collapse banner"}
        >
          <span>{collapsed ? "Show Formats" : "Hide"}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${
              collapsed ? "" : "rotate-180"
            }`}
          />
        </button>
      </div>

      {/* Expandable details */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div
              className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 border-t"
              style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3">
                {PRODUCTION_FORMATS.map((fmt) => {
                  const isSelected = currentRatio === fmt.ratio;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => onSelectRatio(fmt.ratio)}
                      className="group relative flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer"
                      style={{
                        background: isSelected
                          ? "rgba(239, 68, 68, 0.12)"
                          : "rgba(255, 255, 255, 0.025)",
                        borderColor: isSelected
                          ? "rgba(239, 68, 68, 0.55)"
                          : "rgba(255, 255, 255, 0.08)",
                        boxShadow: isSelected
                          ? "0 0 20px rgba(239, 68, 68, 0.2)"
                          : "none",
                      }}
                    >
                      {/* Top row: Platform logos & aspect ratio tag */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center -space-x-1.5">
                          {fmt.platforms.map((p) => {
                            const Icon = p.icon;
                            return (
                              <div
                                key={p.name}
                                className="w-5 h-5 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center shrink-0 shadow-sm"
                                title={p.name}
                              >
                                <Icon size={12} />
                              </div>
                            );
                          })}
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isSelected
                              ? "bg-red-500/30 text-red-300 border border-red-500/40"
                              : "bg-white/10 text-zinc-300 border border-white/10"
                          }`}
                        >
                          {fmt.ratio}
                        </span>
                      </div>

                      {/* Title & highlight */}
                      <div className="flex-1 min-w-0 mb-2">
                        <p
                          className={`text-xs font-bold leading-tight ${
                            isSelected ? "text-red-400" : "text-white"
                          }`}
                        >
                          {fmt.label}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {fmt.desc}
                        </p>
                      </div>

                      {/* Footer: resolution & active check */}
                      <div
                        className="pt-2 mt-auto border-t flex items-center justify-between text-[10px]"
                        style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
                      >
                        <span className="font-mono text-zinc-400">
                          {fmt.resolution}
                        </span>
                        {isSelected ? (
                          <span className="flex items-center gap-1 font-bold text-red-400 text-[10px]">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="text-zinc-400 group-hover:text-white transition-colors text-[10px]">
                            Use this →
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
