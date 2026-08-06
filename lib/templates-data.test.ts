import { describe, expect, it } from "vitest";
import { getTemplateById, getTemplatesByCategory } from "./templates-data";
import type { Template } from "./templates-data";

function makeTemplate(overrides: Partial<Template>): Template {
  return {
    id: "id-1",
    name: "Test",
    templateType: "production",
    category: "minimal",
    description: "",
    tags: [],
    prompt: "",
    coverImageUrl: null,
    accentColor: "#000",
    isPro: false,
    sortOrder: 0,
    ...overrides,
  };
}

describe("getTemplateById", () => {
  const templates = [makeTemplate({ id: "a" }), makeTemplate({ id: "b" })];

  it("finds the matching template", () => {
    expect(getTemplateById(templates, "b")?.id).toBe("b");
  });

  it("returns undefined for an id that doesn't exist — deep-link callers rely on this, not a throw", () => {
    expect(getTemplateById(templates, "missing")).toBeUndefined();
  });

  it("returns undefined on an empty list", () => {
    expect(getTemplateById([], "a")).toBeUndefined();
  });
});

describe("getTemplatesByCategory", () => {
  const templates = [
    makeTemplate({ id: "1", category: "luxury" }),
    makeTemplate({ id: "2", category: "minimal" }),
    makeTemplate({ id: "3", category: "luxury" }),
  ];

  it("passes everything through for the 'all' pseudo-category", () => {
    expect(getTemplatesByCategory(templates, "all")).toHaveLength(3);
  });

  it("filters to only the matching category", () => {
    const result = getTemplatesByCategory(templates, "luxury");
    expect(result.map((t) => t.id)).toEqual(["1", "3"]);
  });

  it("returns an empty array for a category with no matches, not undefined", () => {
    expect(getTemplatesByCategory(templates, "nonexistent")).toEqual([]);
  });
});
