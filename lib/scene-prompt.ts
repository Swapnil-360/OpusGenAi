// When the user supplies their own product photo, we never let the model redraw the
// product — we only generate the surrounding scene and composite the untouched product
// cutout on top client-side. This suffix nudges FLUX to leave the center empty.
// Shared by /api/generate (mode: "background") and /api/replace-bg.
export function buildScenePrompt(userPrompt: string): string {
  return `${userPrompt}. Empty professional product-photography backdrop only — no bottles, no packaging, no products, no objects, just a simple flat surface with soft background and lighting. Straight-on eye-level angle, no strong perspective lines or receding surfaces, no busy interior scene, clean seamless composition, high resolution studio quality, negative space in the center where a product will be placed.`;
}

export const HF_SIZE_MAP: Record<string, { width: number; height: number }> = {
  "1:1":  { width: 512, height: 512 },
  "4:5":  { width: 512, height: 640 },
  "9:16": { width: 576, height: 1024 },
  "16:9": { width: 1024, height: 576 },
  "4:3":  { width: 768, height: 576 },
};

// Premium path (fal-ai/gemini-25-flash-image/edit): the model DOES redraw the
// product via AI (unlike the free paste path), so we bake in explicit
// fidelity + single-product instructions rather than relying on the user to
// know to ask for them.
export function buildProductEditPrompt(userPrompt: string): string {
  return `${userPrompt}. Keep the product's exact shape, proportions, label design, logo, and all text completely accurate and unchanged. Remove any other objects, other products, or background clutter — show only this single product as a clean, professional e-commerce product photo.`;
}
