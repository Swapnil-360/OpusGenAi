export interface Tool {
  id: string;
  label: string;
  description: string;
  href: string;
  creditCost: number;
  badge?: string;
  /** Local path under /public/tools/ — e.g. "/tools/text-to-image.jpg" */
  cardImage: string;
  beforeSeed: string;
  afterSeed: string;
  accentColor: string;
  apiCost: number;
}

export const TOOLS: Tool[] = [
  {
    id: "text-to-image",
    label: "Text to Image",
    description: "Generate professional product photos from a text description using Flux 1.1 Pro.",
    href: "/tools/text-to-image",
    creditCost: 1,
    badge: "Popular",
    cardImage: "/tools/text-to-image.jpg",
    beforeSeed: "abstract1",
    afterSeed: "cosmetic1",
    accentColor: "#8b5cf6",
    apiCost: 0.005,
  },
  {
    id: "remove-bg",
    label: "Remove Background",
    description: "Instantly remove the background from any product photo with pixel-perfect accuracy.",
    href: "/tools/remove-bg",
    creditCost: 1,
    cardImage: "/tools/remove-bg.jpg",
    beforeSeed: "product2",
    afterSeed: "product3",
    accentColor: "#3b82f6",
    apiCost: 0.013,
  },
  {
    id: "replace-bg",
    label: "Replace Background",
    description: "Swap the background of your product image with any scene or color you describe.",
    href: "/tools/replace-bg",
    creditCost: 2,
    badge: "New",
    cardImage: "/tools/replace-bg.jpg",
    beforeSeed: "bottle1",
    afterSeed: "fashion1",
    accentColor: "#10b981",
    apiCost: 0.025,
  },
  {
    id: "cleanup",
    label: "Cleanup",
    description: "Remove unwanted objects, blemishes, or distractions from your product images.",
    href: "/tools/cleanup",
    creditCost: 1,
    cardImage: "/tools/cleanup.jpg",
    beforeSeed: "shoe1",
    afterSeed: "product4",
    accentColor: "#f59e0b",
    apiCost: 0.013,
  },
  {
    id: "upscale",
    label: "Upscale 4×",
    description: "Enhance image resolution up to 4× for print-quality assets without losing sharpness.",
    href: "/tools/upscale",
    creditCost: 2,
    cardImage: "/tools/upscale.jpg",
    beforeSeed: "cosmetic2",
    afterSeed: "bag1",
    accentColor: "#ef4444",
    apiCost: 0.025,
  },
  {
    id: "uncrop",
    label: "Uncrop / Expand",
    description: "Extend your product image in any direction to fit platform dimensions perfectly.",
    href: "/tools/uncrop",
    creditCost: 1,
    cardImage: "/tools/uncrop.jpg",
    beforeSeed: "fashion2",
    afterSeed: "product1",
    accentColor: "#ec4899",
    apiCost: 0.013,
  },
];
