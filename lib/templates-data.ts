export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  tags: string[];
  prompt: string;
  coverSeed: string;
  previewSeeds: string[];
  accentColor: string;
  isPro?: boolean;
}

export type TemplateCategory =
  | "all"
  | "luxury"
  | "minimal"
  | "lifestyle"
  | "editorial"
  | "social"
  | "food"
  | "fashion";

export const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: "all", label: "All Templates" },
  { id: "luxury", label: "Luxury" },
  { id: "minimal", label: "Minimal" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "editorial", label: "Editorial" },
  { id: "social", label: "Social Media" },
  { id: "food", label: "Food & Beverage" },
  { id: "fashion", label: "Fashion" },
];

export const TEMPLATES: Template[] = [
  {
    id: "luxury-shoot",
    name: "Luxury Product Shoot",
    category: "luxury",
    description: "Rich black marble surface with dramatic side lighting and golden accents",
    tags: ["marble", "dark", "dramatic", "luxury"],
    prompt: "on a polished black marble surface with golden hour side lighting, cinematic depth of field, luxury editorial photography style, rich shadows and highlights",
    coverSeed: "cosmetic2",
    previewSeeds: ["cosmetic1", "bottle1", "product2"],
    accentColor: "#d4a853",
  },
  {
    id: "minimal-white",
    name: "Minimal White Studio",
    category: "minimal",
    description: "Clean white background with soft natural diffused light",
    tags: ["white", "clean", "minimal", "studio"],
    prompt: "on a clean white studio background with soft diffused lighting, minimal shadows, professional product photography, crisp and clean",
    coverSeed: "product3",
    previewSeeds: ["product4", "cosmetic1", "shoe1"],
    accentColor: "#e2e8f0",
  },
  {
    id: "lifestyle-scene",
    name: "Lifestyle Scene",
    category: "lifestyle",
    description: "Natural daylight with organic props for an authentic everyday feel",
    tags: ["natural", "daylight", "organic", "lifestyle"],
    prompt: "in a natural lifestyle setting with warm morning light, organic props, wooden surfaces and linen textures, authentic and inviting atmosphere",
    coverSeed: "bag1",
    previewSeeds: ["product1", "fashion1", "bottle2"],
    accentColor: "#84cc16",
  },
  {
    id: "cosmetic-campaign",
    name: "Cosmetic Campaign",
    category: "luxury",
    description: "Soft pastel tones with florals — perfect for beauty brands",
    tags: ["beauty", "soft", "pastel", "florals"],
    prompt: "surrounded by delicate rose petals and soft pastel fabrics, feminine editorial lighting, beauty campaign photography, dewy and luminous",
    coverSeed: "cosmetic1",
    previewSeeds: ["cosmetic2", "bottle1", "product2"],
    accentColor: "#f9a8d4",
  },
  {
    id: "dark-editorial",
    name: "Dark & Moody Editorial",
    category: "editorial",
    description: "Deep shadows, dramatic lighting — cinematic and bold",
    tags: ["dark", "moody", "cinematic", "dramatic"],
    prompt: "in a dark moody setting with dramatic cinematic lighting, deep shadows with selective illumination, editorial fashion photography style, mysterious and sophisticated",
    coverSeed: "fashion2",
    previewSeeds: ["fashion1", "product4", "bag1"],
    accentColor: "#6366f1",
    isPro: true,
  },
  {
    id: "premium-packaging",
    name: "Premium Packaging",
    category: "minimal",
    description: "Architectural composition showcasing packaging detail",
    tags: ["packaging", "detail", "architectural", "clean"],
    prompt: "precision studio photography showing packaging detail, top-down flat lay on warm concrete, architectural composition, soft gradient shadows",
    coverSeed: "product1",
    previewSeeds: ["bottle2", "cosmetic2", "product3"],
    accentColor: "#94a3b8",
  },
  {
    id: "social-media-ad",
    name: "Social Media Ad",
    category: "social",
    description: "High-contrast vibrant shot optimised for feed performance",
    tags: ["social", "vibrant", "high-contrast", "ad"],
    prompt: "bold social media advertisement style, high contrast vibrant colors, clean background with geometric light leaks, optimised for Instagram feed, eye-catching composition",
    coverSeed: "shoe1",
    previewSeeds: ["fashion1", "product1", "cosmetic1"],
    accentColor: "#f97316",
  },
  {
    id: "fashion-editorial",
    name: "Fashion Editorial",
    category: "fashion",
    description: "Magazine-quality editorial framing with fashion-forward aesthetic",
    tags: ["fashion", "editorial", "magazine", "luxury"],
    prompt: "high-fashion editorial photography for luxury magazine, dramatic pose on architectural surface, strong directional light creating graphic shadows, Vogue editorial style",
    coverSeed: "fashion1",
    previewSeeds: ["fashion2", "bag1", "shoe1"],
    accentColor: "#e879f9",
    isPro: true,
  },
  {
    id: "food-photography",
    name: "Food Photography",
    category: "food",
    description: "Appetising overhead and 45° shots for food and beverage",
    tags: ["food", "beverage", "overhead", "natural"],
    prompt: "professional food photography with natural side lighting, on rustic wooden surface with scattered herbs and spices, shallow depth of field, warm and appetizing colors",
    coverSeed: "bottle2",
    previewSeeds: ["product2", "bottle1", "cosmetic2"],
    accentColor: "#fb923c",
  },
  {
    id: "marble-luxury",
    name: "Marble Luxury",
    category: "luxury",
    description: "White Carrara marble with gold accents and botanical styling",
    tags: ["marble", "gold", "botanical", "white"],
    prompt: "on Italian white Carrara marble with delicate gold botanical elements, soft window light casting gentle shadows, luxury home decor photography aesthetic",
    coverSeed: "product2",
    previewSeeds: ["cosmetic1", "bottle1", "product4"],
    accentColor: "#a78bfa",
  },
  {
    id: "outdoor-lifestyle",
    name: "Outdoor Lifestyle",
    category: "lifestyle",
    description: "Natural outdoor light with seasonal botanical elements",
    tags: ["outdoor", "natural", "seasonal", "fresh"],
    prompt: "in an outdoor lifestyle setting with dappled natural sunlight, surrounded by seasonal botanical elements, fresh and energetic atmosphere, health and wellness aesthetic",
    coverSeed: "product4",
    previewSeeds: ["product1", "fashion2", "bag1"],
    accentColor: "#22c55e",
  },
  {
    id: "minimalist-flat-lay",
    name: "Minimalist Flat Lay",
    category: "minimal",
    description: "Perfectly styled overhead composition on a neutral surface",
    tags: ["flat-lay", "overhead", "minimal", "curated"],
    prompt: "perfectly curated minimalist flat lay composition, overhead shot on warm grey linen surface, with carefully placed complementary props, even diffused lighting",
    coverSeed: "product3",
    previewSeeds: ["cosmetic2", "product1", "bottle2"],
    accentColor: "#78716c",
    isPro: true,
  },
];

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  if (category === "all") return TEMPLATES;
  return TEMPLATES.filter((t) => t.category === category);
}
