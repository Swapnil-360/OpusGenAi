import { describe, it, expect } from "vitest";
import { canUseQuality, canUseVideoQuality, isPlanAtLeast, QUALITY_TIERS, VIDEO_TIERS, type VideoQuality } from "@/lib/plans";

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

  it("every tier's credit cost stays in the same $/credit band as the rest of the app", () => {
    for (const q of qualities) {
      const perCredit = VIDEO_TIERS[q].apiCost / VIDEO_TIERS[q].creditCost;
      expect(perCredit).toBeGreaterThan(0.005);
      expect(perCredit).toBeLessThan(0.03);
    }
  });

  it("hd is cheaper than premium despite being higher resolution — this is intentional, not a pricing bug", () => {
    expect(VIDEO_TIERS.hd.resolution).toBe("1080p");
    expect(VIDEO_TIERS.premium.resolution).toBe("720p");
    expect(VIDEO_TIERS.hd.creditCost).toBeLessThan(VIDEO_TIERS.premium.creditCost);
  });
});
