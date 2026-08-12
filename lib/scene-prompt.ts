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

// Universal/portrait path (same fal-ai/gemini-25-flash-image/edit model as
// buildProductEditPrompt): the subject is a person, not a product, so
// fidelity language is about identity, not label/logo accuracy.
export function buildPortraitEditPrompt(userPrompt: string): string {
  return `${userPrompt}. Keep the person's exact face, likeness, facial features, expression, skin tone, and hair completely accurate and unchanged. Remove any other people or distracting background clutter — show only this one person as a clean, professional portrait photo.`;
}

// Campaign path: full brand-campaign scenes — billboards, retail environments,
// multipack packaging, groups of people holding the product. These deliberately
// omit buildProductEditPrompt's "remove any other objects… show only this single
// product" clause, which would directly contradict the entire point of the shot
// (a crowd at a checkout counter, a 4-pack carrier, an out-of-home billboard).
// Brand fidelity is still enforced — that's the part that actually matters when
// the model redraws packaging.
export function buildCampaignEditPrompt(userPrompt: string): string {
  return `${userPrompt}. Keep the product's packaging design, label, logo, brand colours, and all visible text completely accurate and unchanged — no distortion, warping, or invented branding.`;
}
