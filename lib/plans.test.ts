import { describe, it, expect } from "vitest";
import { canUseQuality, canUseVideoQuality, isPlanAtLeast, PLAN_LIMITS, QUALITY_TIERS, VIDEO_TIERS, type VideoQuality } from "@/lib/plans";

describe("isPlanAtLeast", () => {
  it("ranks pro above basic above free", () => {
    expect(isPlanAtLeast("pro", "basic")).toBe(true);
    expect(isPlanAtLeast("basic", "pro")).toBe(false);
    expect(isPlanAtLeast("free", "free")).toBe(true);
  });
});

describe("canUseQuality", () => {
  it("free plan can only use standard", () => {
    expect(canUseQuality("free", "standard")).toBe(true);
    expect(canUseQuality("free", "hd")).toBe(false);
    expect(canUseQuality("free", "ultra")).toBe(false);
  });

  it("basic and pro both unlock hd/ultra", () => {
    expect(canUseQuality("basic", "hd")).toBe(true);
    expect(canUseQuality("basic", "ultra")).toBe(true);
    expect(canUseQuality("pro", "hd")).toBe(true);
    expect(canUseQuality("pro", "ultra")).toBe(true);
  });
});

describe("QUALITY_TIERS", () => {
  it("hd and ultra request a resolution param, standard does not", () => {
    expect(QUALITY_TIERS.standard.resolution).toBeUndefined();
    expect(QUALITY_TIERS.hd.resolution).toBe("2K");
    expect(QUALITY_TIERS.ultra.resolution).toBe("4K");
  });

  it("credit cost climbs with resolution", () => {
    expect(QUALITY_TIERS.standard.creditCost).toBeLessThan(QUALITY_TIERS.hd.creditCost);
    expect(QUALITY_TIERS.hd.creditCost).toBeLessThan(QUALITY_TIERS.ultra.creditCost);
  });
});

describe("VIDEO_TIERS", () => {
  const qualities: VideoQuality[] = ["standard", "hd", "premium"];

  it("all three qualities are Pro-only", () => {
    for (const q of qualities) {
      expect(VIDEO_TIERS[q].minPlan).toBe("pro");
      expect(canUseVideoQuality("basic", q)).toBe(false);
      expect(canUseVideoQuality("pro", q)).toBe(true);
    }
  });

  // Deliberately NOT the same ~85%+ band as QUALITY_TIERS (images) — video is
  // Pro's headline feature, priced at ~50-68% margin specifically to maximize
  // clips-per-dollar for a Pro subscriber over per-clip profit. Still every
  // tier must be genuinely profitable, just not at the image-tier margin.
  it("every tier stays profitable but in a deliberately lower ~40-70% margin band than images", () => {
    const revenuePerCredit = PLAN_LIMITS.pro.price / PLAN_LIMITS.pro.credits;
    for (const q of qualities) {
      const tier = VIDEO_TIERS[q];
      const revenue = tier.creditCost * revenuePerCredit;
      const margin = (revenue - tier.apiCost) / revenue;
      expect(margin).toBeGreaterThan(0.4);
      expect(margin).toBeLessThan(0.7);
    }
  });

  it("worst-case Pro usage (100% Premium video, the priciest tier) still clears 45% blended margin", () => {
    const revenuePerCredit = PLAN_LIMITS.pro.price / PLAN_LIMITS.pro.credits;
    const clips = Math.floor(PLAN_LIMITS.pro.credits / VIDEO_TIERS.premium.creditCost);
    const totalCost = clips * VIDEO_TIERS.premium.apiCost;
    const margin = (PLAN_LIMITS.pro.price - totalCost) / PLAN_LIMITS.pro.price;
    expect(margin).toBeGreaterThan(0.45);
  });

  it("hd is priced above standard despite a slightly lower real API cost — value-based pricing for sharper resolution, not a cost-ordering bug", () => {
    expect(VIDEO_TIERS.hd.apiCost).toBeLessThan(VIDEO_TIERS.standard.apiCost);
    expect(VIDEO_TIERS.hd.creditCost).toBeGreaterThan(VIDEO_TIERS.standard.creditCost);
  });

  it("premium costs more credits than either standard or hd", () => {
    expect(VIDEO_TIERS.premium.creditCost).toBeGreaterThan(VIDEO_TIERS.standard.creditCost);
    expect(VIDEO_TIERS.premium.creditCost).toBeGreaterThan(VIDEO_TIERS.hd.creditCost);
  });
});
