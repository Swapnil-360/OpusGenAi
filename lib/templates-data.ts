// Templates live in Supabase (public.templates) so they can be added/edited
// from the admin panel without a code deploy — see lib/hooks/use-templates.ts
// for the fetch. This file only holds the shared type and static UI metadata
// (category chip labels), not the template rows themselves.

export type TemplateType = "production" | "universal" | "campaign" | "video";

export interface Template {
  id: string;
  name: string;
  templateType: TemplateType;
  category: string;
  description: string;
  tags: string[];
  /** The [FIELD] labels this template needs the user to fill in (e.g.
   *  "YOUR BRAND"). The prompt itself is never sent to the browser — it's
   *  resolved server-side from the template id at generation time — so this
   *  is what lets the UI collect the required values without exposing it. */
  placeholders: string[];
  coverImageUrl: string | null;
  /** Video templates only — a short looping preview clip. Null until one has
   *  been generated, in which case coverImageUrl acts as the poster frame. */
  previewVideoUrl: string | null;
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

// Campaign templates are full brand-advertising scenes rather than a single
// clean product shot — retail environments, out-of-home billboards, multipack
// packaging, lifestyle groups. Their own category vocabulary again.
export const CAMPAIGN_CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "All Templates" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "skincare", label: "Skincare" },
  { id: "makeup", label: "Makeup" },
  { id: "fragrance", label: "Fragrance" },
  { id: "haircare", label: "Hair Care" },
  { id: "bodycare", label: "Body Care" },
  { id: "packaging", label: "Packaging" },
  { id: "outdoor", label: "Out-of-Home" },
  { id: "identity", label: "Brand Identity" },
];

// Video templates are motion prompts for the image-to-video generator — the
// vocabulary is camera movement and mood rather than scene/surface, so again
// its own list.
export const VIDEO_CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "All Templates" },
  { id: "luxury", label: "Luxury" },
  { id: "dynamic", label: "Dynamic" },
  { id: "natural", label: "Natural" },
  { id: "moody", label: "Moody" },
  { id: "minimal", label: "Minimal" },
];

export function getTemplateById(templates: Template[], id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}

export function getTemplatesByCategory(templates: Template[], category: string): Template[] {
  if (category === "all") return templates;
  return templates.filter((t) => t.category === category);
}
