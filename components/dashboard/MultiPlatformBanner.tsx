"use client";

import { Sparkles } from "lucide-react";
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

export function MultiPlatformBanner({}: MultiPlatformBannerProps = {}) {
  return (
    <div className="w-full space-y-2.5 mb-5">
      {/* Visual Workflow Banner Showcase */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo/Opusgen_banner.png"
          alt="OpusGen Multi-Platform Production Ready Workflow"
          className="w-full h-auto block object-cover"
          loading="lazy"
        />
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
