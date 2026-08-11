import { describe, it, expect } from "vitest";
import { canUseQuality, isPlanAtLeast, QUALITY_TIERS, VIDEO_TIER } from "@/lib/plans";

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

describe("VIDEO_TIER", () => {
  it("is Pro-only", () => {
    expect(VIDEO_TIER.minPlan).toBe("pro");
    expect(isPlanAtLeast("basic", VIDEO_TIER.minPlan)).toBe(false);
    expect(isPlanAtLeast("pro", VIDEO_TIER.minPlan)).toBe(true);
  });

  it("credit cost stays in the same $/credit band as every other tier", () => {
    const perCredit = VIDEO_TIER.apiCost / VIDEO_TIER.creditCost;
    expect(perCredit).toBeGreaterThan(0.005);
    expect(perCredit).toBeLessThan(0.03);
  });
});
