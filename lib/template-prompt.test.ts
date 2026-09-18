import { describe, expect, it } from "vitest";
import {
  extractPlaceholders,
  formatAdditionalPrompt,
  resolveTemplatePrompt,
} from "./template-prompt";

describe("extractPlaceholders", () => {
  it("extracts unique placeholders from a prompt", () => {
    const prompt =
      "Commercial product photo of [PRODUCT] on [SURFACE], featuring [PRODUCT] branding.";
    expect(extractPlaceholders(prompt)).toEqual(["PRODUCT", "SURFACE"]);
  });

  it("returns an empty array when no placeholders are present", () => {
    expect(extractPlaceholders("Clean studio background")).toEqual([]);
  });
});

describe("formatAdditionalPrompt", () => {
  it("returns empty string for blank input", () => {
    expect(formatAdditionalPrompt("   ")).toBe("");
  });

  it("structures brand-oriented inputs with prominent brand instructions", () => {
    const res = formatAdditionalPrompt(
      "Brand: Zenith Luxe - minimalist luxury Swiss watches",
    );
    expect(res).toContain("Featured brand & custom direction:");
    expect(res).toContain(
      "Zenith Luxe - minimalist luxury Swiss watches",
    );
    expect(res).toContain(
      "Faithfully incorporate and prominently highlight this brand identity, name, and requested details.",
    );
  });

  it("structures general creative tweaks and directions", () => {
    const res = formatAdditionalPrompt(
      "warm golden hour lighting, dark stone pedestal",
    );
    expect(res).toContain(
      "Additional brand details & creative direction: warm golden hour lighting, dark stone pedestal.",
    );
  });
});

describe("resolveTemplatePrompt", () => {
  it("substitutes placeholders and preserves prompt when no extra input is given", () => {
    const res = resolveTemplatePrompt("Photo of [PRODUCT] on [BACKGROUND].", {
      PRODUCT: "perfume bottle",
      BACKGROUND: "white marble",
    });
    expect(res).toBe("Photo of perfume bottle on white marble.");
  });

  it("analyzes and incorporates brand details seamlessly into the final prompt", () => {
    const res = resolveTemplatePrompt(
      "Photo of [PRODUCT] on [BACKGROUND].",
      {
        PRODUCT: "skincare serum",
        BACKGROUND: "slate rock",
      },
      "Brand: GlowBotanics - organic cruelty-free skincare",
    );
    expect(res).toContain("Photo of skincare serum on slate rock.");
    expect(res).toContain("Featured brand & custom direction: Brand: GlowBotanics");
    expect(res).toContain("prominently highlight this brand identity");
  });

  it("handles prompts without terminal punctuation cleanly", () => {
    const res = resolveTemplatePrompt(
      "Photo of [PRODUCT]",
      { PRODUCT: "watch" },
      "Apex Luxury Watches",
    );
    expect(res).toBe(
      "Photo of watch. Additional brand details & creative direction: Apex Luxury Watches. Faithfully incorporate and highlight these specifications in the scene.",
    );
  });
});
