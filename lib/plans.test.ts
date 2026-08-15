import { describe, it, expect } from "vitest";
import {
  canUseQuality, canUseVideoQuality, canUseMultiImageVideo, hasReachedBasicVideoLimit, isPlanAtLeast,
  BASIC_STANDARD_VIDEO_LIMIT, MULTI_IMAGE_VIDEO_TIER, PLAN_LIMITS, QUALITY_TIERS, VIDEO_TIERS, type VideoQuality,
} from "@/lib/plans";

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

  it("standard is available to Basic and Pro — the one video tier Basic can reach", () => {
    expect(VIDEO_TIERS.standard.minPlan).toBe("basic");
    expect(canUseVideoQuality("free", "standard")).toBe(false);
    expect(canUseVideoQuality("basic", "standard")).toBe(true);
    expect(canUseVideoQuality("pro", "standard")).toBe(true);
  });

  it("hd and premium stay Pro-only — Basic's video access is Standard only", () => {
    for (const q of ["hd", "premium"] as VideoQuality[]) {
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

describe("MULTI_IMAGE_VIDEO_TIER", () => {
  it("is Pro-only, same as every VIDEO_TIERS entry", () => {
    expect(MULTI_IMAGE_VIDEO_TIER.minPlan).toBe("pro");
    expect(canUseMultiImageVideo("basic")).toBe(false);
    expect(canUseMultiImageVideo("pro")).toBe(true);
  });

  it("stays in the same ~40-70% margin band as the single-image video tiers", () => {
    const revenuePerCredit = PLAN_LIMITS.pro.price / PLAN_LIMITS.pro.credits;
    const revenue = MULTI_IMAGE_VIDEO_TIER.creditCost * revenuePerCredit;
    const margin = (revenue - MULTI_IMAGE_VIDEO_TIER.apiCost) / revenue;
    expect(margin).toBeGreaterThan(0.4);
    expect(margin).toBeLessThan(0.7);
  });

  it("allows a main photo plus at least one extra reference photo", () => {
    expect(MULTI_IMAGE_VIDEO_TIER.maxImages).toBeGreaterThanOrEqual(2);
  });
});

describe("Basic-plan video access", () => {
  it("Standard's margin holds up at Basic's own (slightly higher) revenue-per-credit rate, not just Pro's", () => {
    // VIDEO_TIERS' margin tests above all compute against Pro's
    // revenue-per-credit — opening Standard to Basic means that math needs
    // to hold at Basic's rate too, not be quietly assumed from Pro's.
    const revenuePerCredit = PLAN_LIMITS.basic.price / PLAN_LIMITS.basic.credits;
    const tier = VIDEO_TIERS.standard;
    const revenue = tier.creditCost * revenuePerCredit;
    const margin = (revenue - tier.apiCost) / revenue;
    expect(margin).toBeGreaterThan(0.4);
    expect(margin).toBeLessThan(0.7);
  });

  it("hasReachedBasicVideoLimit only ever applies to the basic plan", () => {
    expect(hasReachedBasicVideoLimit("basic", BASIC_STANDARD_VIDEO_LIMIT)).toBe(true);
    expect(hasReachedBasicVideoLimit("basic", BASIC_STANDARD_VIDEO_LIMIT - 1)).toBe(false);
    // Pro has no cap regardless of count — the limit constant is a Basic-only
    // concept, not a global video ceiling.
    expect(hasReachedBasicVideoLimit("pro", 999)).toBe(false);
    expect(hasReachedBasicVideoLimit("free", 999)).toBe(false);
  });

  it("the limit is reached at exactly the Nth video, not before or after", () => {
    for (let n = 0; n < BASIC_STANDARD_VIDEO_LIMIT; n++) {
      expect(hasReachedBasicVideoLimit("basic", n)).toBe(false);
    }
    expect(hasReachedBasicVideoLimit("basic", BASIC_STANDARD_VIDEO_LIMIT)).toBe(true);
  });
});
