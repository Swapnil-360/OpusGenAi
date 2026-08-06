import { describe, expect, it } from "vitest";
import { buildScenePrompt, buildProductEditPrompt, buildPortraitEditPrompt, HF_SIZE_MAP } from "./scene-prompt";

describe("buildScenePrompt", () => {
  it("prefixes the user prompt and forbids products in the generated scene", () => {
    const out = buildScenePrompt("marble kitchen counter");
    expect(out.startsWith("marble kitchen counter.")).toBe(true);
    expect(out).toContain("no products");
    expect(out).toContain("negative space in the center");
  });

  it("passes an empty prompt through without throwing", () => {
    expect(() => buildScenePrompt("")).not.toThrow();
  });
});

describe("buildProductEditPrompt", () => {
  it("demands label/logo/text fidelity — this is the premium path's core promise", () => {
    const out = buildProductEditPrompt("on a beach at sunset");
    expect(out).toContain("label design, logo");
    expect(out).toContain("single product");
  });
});

describe("buildPortraitEditPrompt", () => {
  it("demands facial identity fidelity, not product fidelity", () => {
    const out = buildPortraitEditPrompt("golden hour lifestyle portrait");
    expect(out).toContain("face, likeness");
    expect(out).not.toContain("label");
  });
});

describe("HF_SIZE_MAP", () => {
  it("covers every aspect ratio the UI offers, each with a positive width/height", () => {
    for (const ratio of ["1:1", "4:5", "9:16", "16:9", "4:3"]) {
      const dims = HF_SIZE_MAP[ratio];
      expect(dims, `missing dims for ${ratio}`).toBeDefined();
      expect(dims.width).toBeGreaterThan(0);
      expect(dims.height).toBeGreaterThan(0);
    }
  });

  it("matches the real aspect ratio within rounding tolerance", () => {
    // Catches a copy-paste transposition (e.g. 9:16 shipped as 16:9 dims) —
    // exactly the kind of bug that's invisible in review but breaks every
    // generated image's framing.
    const targets: Record<string, number> = {
      "1:1": 1 / 1, "4:5": 4 / 5, "9:16": 9 / 16, "16:9": 16 / 9, "4:3": 4 / 3,
    };
    for (const [ratio, target] of Object.entries(targets)) {
      const { width, height } = HF_SIZE_MAP[ratio];
      expect(width / height).toBeCloseTo(target, 1);
    }
  });
});
