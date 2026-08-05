// Templates live in Supabase (public.templates) so they can be added/edited
// from the admin panel without a code deploy — see lib/hooks/use-templates.ts
// for the fetch. This file only holds the shared type and static UI metadata
// (category chip labels), not the template rows themselves.

export type TemplateType = "production" | "universal";

export interface Template {
  id: string;
  name: string;
  templateType: TemplateType;
  category: string;
  description: string;
  tags: string[];
  prompt: string;
  coverImageUrl: string | null;
  accentColor: string;
  isPro: boolean;
  sortOrder: number;
}

// Production templates describe a scene/surface for a product photo.
// The first block below is style-based (luxury, minimal, ...); the second
// is product-type-based (perfume, skincare, ...) — same "production" type,
// a different axis of categorization, both shown as filter chips.
export const PRODUCTION_CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "All Templates" },
  { id: "luxury", label: "Luxury" },
  { id: "minimal", label: "Minimal" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "editorial", label: "Editorial" },
  { id: "social", label: "Social Media" },
  { id: "food", label: "Food & Beverage" },
  { id: "fashion", label: "Fashion" },
  { id: "perfume", label: "Perfume / Body Spray" },
  { id: "skincare", label: "Skincare" },
  { id: "jewelry", label: "Jewelry" },
  { id: "watch", label: "Watch" },
  { id: "supplement", label: "Supplement / Bottle" },
  { id: "sneakers", label: "Sneakers / Shoes" },
  { id: "handbag", label: "Handbag" },
  { id: "electronics", label: "Electronics" },
  { id: "candle", label: "Candle" },
];

// Universal templates describe a portrait scene for a person's own photo —
// a different vocabulary than product categories, so it's a separate list.
export const UNIVERSAL_CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "All Templates" },
  { id: "professional", label: "Professional" },
  { id: "social", label: "Social" },
  { id: "editorial", label: "Editorial" },
  { id: "monochrome", label: "Monochrome" },
  { id: "outdoor", label: "Outdoor" },
];

export function getTemplateById(templates: Template[], id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}

export function getTemplatesByCategory(templates: Template[], category: string): Template[] {
  if (category === "all") return templates;
  return templates.filter((t) => t.category === category);
}
