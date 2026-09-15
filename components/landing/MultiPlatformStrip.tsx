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
  { name: "Amazon", icon: AmazonLogo, tag: "1:1 Listings" },
  { name: "Shopify", icon: ShopifyLogo, tag: "1:1 & Banners" },
  { name: "Instagram", icon: InstagramLogo, tag: "Feeds & Reels" },
  { name: "TikTok", icon: TikTokLogo, tag: "9:16 Video" },
  { name: "Etsy", icon: EtsyLogo, tag: "Product Cards" },
  { name: "eBay", icon: EbayLogo, tag: "Catalog Listings" },
  { name: "Walmart", icon: WalmartLogo, tag: "Marketplace" },
  { name: "Pinterest", icon: PinterestLogo, tag: "Product Pins" },
  { name: "Facebook", icon: FacebookLogo, tag: "Ads & Feed" },
  { name: "Shopee", icon: ShopeeLogo, tag: "Mobile Mall" },
];

export function MultiPlatformStrip() {
  return (
    <section className="py-8 md:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl p-6 sm:p-8 md:p-10 border overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(255, 255, 255, 0.035) 0%, rgba(20, 5, 5, 0.6) 100%)",
            borderColor: "rgba(255, 255, 255, 0.08)",
            boxShadow:
              "0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
          }}
        >
          {/* Subtle background glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-96 h-96 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(220, 38, 38, 0.12) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
            {/* Left copy */}
            <div className="max-w-xl">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-widest uppercase mb-3"
                style={{
                  background: "rgba(220,38,38,0.18)",
                  border: "1px solid rgba(220,38,38,0.35)",
                  color: "#fca5a5",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                E-Commerce Ready Outputs
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                One Product Photo.
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(130deg, #fca5a5 0%, #f87171 50%, #ef4444 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Formatted For Every Platform.
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 mt-2.5 leading-relaxed">
                Generate studio-grade product visuals tailored to the exact
                aspect ratios, safe zones, and resolution standards of the
                world&apos;s leading marketplaces and social channels.
              </p>
            </div>

            {/* Right: Dimension Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold text-zinc-200"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <span className="w-2 h-2 rounded-sm bg-red-500 shrink-0" />
                <span>
                  <strong className="text-white">1:1</strong> Marketplace
                  Listings
                </span>
              </div>

              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold text-zinc-200"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <span className="w-1.5 h-2.5 rounded-xs bg-cyan-400 shrink-0" />
                <span>
                  <strong className="text-white">9:16</strong> Stories &amp;
                  Reels
                </span>
              </div>

              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold text-zinc-200"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <span className="w-3 h-1.5 rounded-xs bg-amber-400 shrink-0" />
                <span>
                  <strong className="text-white">16:9</strong> Hero Banners
                </span>
              </div>
            </div>
          </div>

          {/* Platform Logos Marquee Row */}
          <div className="relative z-10 mt-6 md:mt-8 pt-6 border-t border-white/10">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-4 text-center sm:text-left">
              Suitable for all marketplaces, platforms, and channels
            </p>
            <div
              className="w-full overflow-hidden"
              style={{
                maskImage:
                  "linear-gradient(to right, transparent 0%, black min(10vw, 64px), black calc(100% - min(10vw, 64px)), transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent 0%, black min(10vw, 64px), black calc(100% - min(10vw, 64px)), transparent 100%)",
              }}
            >
              <motion.div
                className="flex items-center gap-3 w-max"
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
                      className="flex flex-col items-center justify-center w-28 sm:w-32 py-3 px-2 rounded-2xl border transition-all shrink-0 select-none hover:border-red-500/40 hover:bg-white/5"
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        borderColor: "rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 shrink-0">
                        <Icon size={22} />
                      </div>
                      <span className="text-[11px] font-bold text-zinc-100 leading-tight">
                        {p.name}
                      </span>
                      <span className="text-[9px] text-zinc-400 mt-1 text-center leading-none">
                        {p.tag}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
