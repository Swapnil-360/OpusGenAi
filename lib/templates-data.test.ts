import { describe, expect, it } from "vitest";
import {
  getTemplateById,
  getTemplatesByCategory,
  getTemplateDurationOption,
  syncTagsWithDuration,
} from "./templates-data";
import type { Template } from "./templates-data";

function makeTemplate(overrides: Partial<Template>): Template {
  return {
    id: "id-1",
    name: "Test",
    templateType: "production",
    category: "minimal",
    description: "",
    tags: [],
    placeholders: [],
    imageSlots: [],
    imageSlotsOptional: false,
    coverImageUrl: null,
    previewVideoUrl: null,
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

describe("getTemplateDurationOption", () => {
  it("defaults to 'both' when no tags or empty array is provided", () => {
    expect(getTemplateDurationOption()).toBe("both");
    expect(getTemplateDurationOption([])).toBe("both");
    expect(getTemplateDurationOption(["fashion", "luxury"])).toBe("both");
  });

  it("returns '5s' when duration:5s or duration:5 is present", () => {
    expect(getTemplateDurationOption(["duration:5s"])).toBe("5s");
    expect(getTemplateDurationOption(["fashion", "duration:5s", "minimal"])).toBe("5s");
    expect(getTemplateDurationOption(["duration:5"])).toBe("5s");
    expect(getTemplateDurationOption(["DURATION:5S"])).toBe("5s");
  });

  it("returns '10s' when duration:10s or duration:10 is present", () => {
    expect(getTemplateDurationOption(["duration:10s"])).toBe("10s");
    expect(getTemplateDurationOption(["fashion", "duration:10s"])).toBe("10s");
    expect(getTemplateDurationOption(["duration:10"])).toBe("10s");
    expect(getTemplateDurationOption(["DURATION:10S"])).toBe("10s");
  });

  it("defaults to 'both' on unrecognized duration tags", () => {
    expect(getTemplateDurationOption(["duration:15s"])).toBe("both");
    expect(getTemplateDurationOption(["duration:unknown"])).toBe("both");
  });
});

describe("syncTagsWithDuration", () => {
  it("adds duration tag when set to 5s or 10s", () => {
    expect(syncTagsWithDuration(["luxury", "perfume"], "5s")).toEqual([
      "luxury",
      "perfume",
      "duration:5s",
    ]);
    expect(syncTagsWithDuration(["luxury", "perfume"], "10s")).toEqual([
      "luxury",
      "perfume",
      "duration:10s",
    ]);
  });

  it("removes duration tag when set to both", () => {
    expect(syncTagsWithDuration(["luxury", "duration:5s", "perfume"], "both")).toEqual([
      "luxury",
      "perfume",
    ]);
    expect(syncTagsWithDuration(["duration:10s"], "both")).toEqual([]);
  });

  it("replaces existing duration tag cleanly", () => {
    expect(syncTagsWithDuration(["luxury", "duration:5s", "perfume"], "10s")).toEqual([
      "luxury",
      "perfume",
      "duration:10s",
    ]);
    expect(syncTagsWithDuration(["duration:10s"], "5s")).toEqual(["duration:5s"]);
  });
});
