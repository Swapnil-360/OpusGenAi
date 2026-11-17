"use client";

import { useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
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

const GUIDE_STEPS = [
  {
    step: 1,
    title: "Upload Clear Product Photo",
    accent: "red",
    desc: "Use a well-lit photo centered on your product. Clean backgrounds and sharp edges produce the most realistic AI scene blending.",
  },
  {
    step: 2,
    title: "Describe Scene & Mood",
    accent: "amber",
    desc: "Specify surface textures (e.g., black marble, natural oak), lighting direction, and aesthetic ambiance to match your brand style.",
  },
  {
    step: 3,
    title: "Select Framing & Aspect Ratio",
    accent: "red",
    desc: "Choose 1:1 for Amazon & Shopify square listings, 9:16 for vertical reels and ads, or 16:9 for landscape website banners.",
  },
  {
    step: 4,
    title: "Studio-Grade Lighting & Shadows",
    accent: "red",
    desc: "OpusGen AI automatically calculates contact shadows, reflections, and depth of field for marketplace-ready results.",
  },
];

export function MultiPlatformBanner({}: MultiPlatformBannerProps = {}) {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="w-full space-y-2.5 mb-5">
      {/* ── Guidance & Best Practices Banner (Matching Video Generation Style) ── */}
      <div
        className={`rounded-2xl border border-red-500/20 transition-all ${
          showGuide ? "p-3.5 sm:p-4" : "py-2 px-3 sm:py-2.5 sm:px-3.5"
        }`}
        style={{
          background:
            "linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(15,4,4,0.85) 100%)",
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowGuide((v) => !v)}
            className="flex items-center gap-2 text-left cursor-pointer hover:opacity-90 transition-opacity min-w-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider truncate">
              Image Generation Guide &amp; Best Practices
            </h2>
          </button>
          <button
            type="button"
            onClick={() => setShowGuide((v) => !v)}
            className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <span>{showGuide ? "Hide guide" : "View guide"}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                showGuide ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {showGuide && (
          <div className="space-y-2.5 mt-2.5 pt-2.5 border-t border-white/10 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {GUIDE_STEPS.map((s) => {
                const isAmber = s.accent === "amber";
                return (
                  <div
                    key={s.step}
                    className={`rounded-xl p-2.5 bg-black/40 border ${
                      isAmber ? "border-amber-500/25" : "border-white/5"
                    } space-y-1`}
                  >
                    <div
                      className={`flex items-center gap-1.5 font-semibold ${
                        isAmber ? "text-amber-300" : "text-red-300"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full ${
                          isAmber
                            ? "bg-amber-500/30 text-amber-400"
                            : "bg-red-600/30 text-red-400"
                        } flex items-center justify-center text-[10px] font-bold`}
                      >
                        {s.step}
                      </span>
                      {s.title}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
