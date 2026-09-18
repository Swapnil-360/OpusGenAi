"use client";

import { motion } from "framer-motion";
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
  ShopeeLogo,
} from "@/components/shared/PlatformLogos";

const PLATFORMS = [
  { name: "Amazon", icon: AmazonLogo, ratio: "1:1" },
  { name: "Shopify", icon: ShopifyLogo, ratio: "1:1 · 16:9" },
  { name: "TikTok", icon: TikTokLogo, ratio: "9:16" },
  { name: "Instagram", icon: InstagramLogo, ratio: "1:1 · 9:16" },
  { name: "Etsy", icon: EtsyLogo, ratio: "4:3 · 1:1" },
  { name: "eBay", icon: EbayLogo, ratio: "1:1" },
  { name: "Walmart", icon: WalmartLogo, ratio: "1:1" },
  { name: "Pinterest", icon: PinterestLogo, ratio: "2:3" },
  { name: "Facebook", icon: FacebookLogo, ratio: "1:1 · 16:9" },
  { name: "Shopee", icon: ShopeeLogo, ratio: "1:1" },
];

export function MultiPlatformStrip() {
  return (
    <section className="py-3 md:py-5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.45 }}
          className="relative rounded-2xl p-3.5 sm:p-4.5 border overflow-hidden backdrop-blur-md"
          style={{
            background:
              "linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(18, 5, 5, 0.45) 100%)",
            borderColor: "rgba(255, 255, 255, 0.08)",
            boxShadow:
              "0 10px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
          }}
        >
          {/* Subtle accent glow */}
          <div
            className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-72 h-28 rounded-full"
            style={{
              background:
                "radial-gradient(ellipse, rgba(220, 38, 38, 0.08) 0%, transparent 70%)",
              filter: "blur(36px)",
            }}
          />

          {/* Header Row: Title & Format Badges in one compact row */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-2.5 mb-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
                style={{
                  background: "rgba(220, 38, 38, 0.14)",
                  border: "1px solid rgba(220, 38, 38, 0.3)",
                  color: "#fca5a5",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Multi-Platform Ready
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                One product photo, production-ready for every marketplace &amp; channel
              </h3>
            </div>

            {/* Compact Format Indicators */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] font-medium text-zinc-400 shrink-0">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border"
                style={{
                  background: "rgba(255, 255, 255, 0.035)",
                  borderColor: "rgba(255, 255, 255, 0.08)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-xs bg-red-500 shrink-0" />
                <span className="text-zinc-300">
                  <strong className="text-white font-semibold">1:1</strong> Listings
                </span>
              </div>

              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border"
                style={{
                  background: "rgba(255, 255, 255, 0.035)",
                  borderColor: "rgba(255, 255, 255, 0.08)",
                }}
              >
                <span className="w-1.5 h-2 rounded-xs bg-cyan-400 shrink-0" />
                <span className="text-zinc-300">
                  <strong className="text-white font-semibold">9:16</strong> Reels &amp; TikTok
                </span>
              </div>

              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border"
                style={{
                  background: "rgba(255, 255, 255, 0.035)",
                  borderColor: "rgba(255, 255, 255, 0.08)",
                }}
              >
                <span className="w-2 h-1.5 rounded-xs bg-amber-400 shrink-0" />
                <span className="text-zinc-300">
                  <strong className="text-white font-semibold">16:9</strong> Banners
                </span>
              </div>
            </div>
          </div>

          {/* Marquee Row: Sleek continuous pill badges */}
          <div
            className="relative z-10 w-full overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent 0%, black min(8vw, 48px), black calc(100% - min(8vw, 48px)), transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black min(8vw, 48px), black calc(100% - min(8vw, 48px)), transparent 100%)",
            }}
          >
            <motion.div
              className="flex items-center gap-2 sm:gap-2.5 w-max py-0.5"
              animate={{ x: "-50%" }}
              transition={{
                duration: 28,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {[...PLATFORMS, ...PLATFORMS].map((p, i) => {
                const Icon = p.icon;
                return (
                  <div
                    key={`${p.name}-${i}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all shrink-0 select-none hover:border-white/20 hover:bg-white/[0.05]"
                    style={{
                      background: "rgba(255, 255, 255, 0.025)",
                      borderColor: "rgba(255, 255, 255, 0.07)",
                    }}
                  >
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                      <Icon size={15} />
                    </div>
                    <span className="text-xs font-semibold text-zinc-200">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {p.ratio}
                    </span>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
