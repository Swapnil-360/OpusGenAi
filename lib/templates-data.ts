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
  /** Video templates only — labels for FIXED, REQUIRED reference-photo slots
   *  beyond the main one (e.g. ["Reference Model Photo"]) — every labeled
   *  slot must be filled before generating. Empty means either a classic
   *  single-image template, or (if `imageSlotsOptional` is true) a template
   *  that accepts extra photos without assigning them fixed roles. The
   *  prompt referencing @Image1/@Image2/... for these lives server-side same
   *  as the rest of the prompt — these labels are just enough to render the
   *  extra upload boxes. */
  imageSlots: string[];
  /** Video templates only. When true, extra reference photos beyond the main
   *  one are optional and unstructured — the same growable "add a photo"
   *  flow as a template-free generation, just still available with this
   *  template applied — rather than `imageSlots`' fixed, required, labeled
   *  boxes. For a template whose prompt adapts to whatever content is
   *  uploaded (e.g. "use each reference image according to its role") rather
   *  than needing a specific numbered shot in each slot. */
  imageSlotsOptional: boolean;
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

// Video templates are one motion concept per product category (not a style
// axis like the original camera-movement set) — each row's `category` is the
// product type it was written for, so this doubles as both the filter list
// and the label shown directly on each template card.
export const VIDEO_CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "All Templates" },
  { id: "cosmetics", label: "Cosmetics" },
  { id: "lipstick", label: "Lipstick / Lip Tint" },
  { id: "skincare", label: "Skincare / Serum" },
  { id: "perfume", label: "Perfume" },
  { id: "drinks", label: "Drinks" },
  { id: "soda", label: "Soda" },
  { id: "energy-drink", label: "Energy Drink" },
  { id: "ice-cream", label: "Ice Cream" },
  { id: "chocolate", label: "Chocolate / Candy" },
  { id: "shoes", label: "Shoes" },
  { id: "sneakers", label: "Sneakers" },
  { id: "clothing", label: "Clothing" },
  { id: "watch-jewelry", label: "Watch / Jewelry" },
  { id: "food-packaging", label: "Food Packaging" },
  { id: "electronics", label: "Electronics" },
  { id: "generic", label: "Generic Product" },
  { id: "campaign", label: "Marketing Campaign" },
];

export function getTemplateById(templates: Template[], id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}

export function getTemplatesByCategory(templates: Template[], category: string): Template[] {
  if (category === "all") return templates;
  return templates.filter((t) => t.category === category);
}
