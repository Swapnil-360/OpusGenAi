export type Plan = "free" | "basic" | "pro";

export type Quality = "standard" | "hd" | "ultra";

export interface QualityTier {
  /** fal.ai model endpoint. */
  model: string;
  /** Nano Banana 2's `resolution` input param — undefined for models (like
   *  the standard gemini path) that don't take one. Charging 5 or 6 credits
   *  without actually requesting the matching resolution would be a real
   *  billing bug, not just a missed feature — this field is what prevents that. */
  resolution?: "1K" | "2K" | "4K";
  /** Real API cost per generation, USD — informational, drives the credit cost below. */
  apiCost: number;
  creditCost: number;
  /** Lowest plan that may use this quality. */
  minPlan: Plan;
}

// Single source of truth for what a request at a given quality actually costs
// and which model (+ resolution) serves it. Server routes must resolve model,
// resolution, and creditCost from the SAME lookup so a client can never
// request the expensive output at the cheap price — see app/api/generate/route.ts.
export const QUALITY_TIERS: Record<Quality, QualityTier> = {
  standard: {
    model: "fal-ai/gemini-25-flash-image/edit",
    apiCost: 0.039,
    creditCost: 3,
    minPlan: "free",
  },
  hd: {
    model: "fal-ai/nano-banana-2/edit",
    resolution: "2K",
    apiCost: 0.12,
    creditCost: 5,
    minPlan: "basic",
  },
  ultra: {
    model: "fal-ai/nano-banana-2/edit",
    resolution: "4K",
    apiCost: 0.16,
    creditCost: 6,
    minPlan: "basic",
  },
};

export interface PlanLimits {
  name: string;
  price: number;
  originalPrice?: number;
  credits: number;
  features: string[];
  cta: string;
  highlight: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    name: "Free",
    price: 0,
    credits: 10,
    features: ["10 credits to start", "All 6 tools", "Standard quality", "JPG download", "All templates"],
    cta: "Get started free",
    highlight: false,
  },
  basic: {
    name: "Basic",
    price: 9.99,
    credits: 50,
    features: ["50 credits/month", "All 6 tools", "HD + 4K quality", "PNG + JPG download", "All templates", "Social captions"],
    cta: "Get Basic",
    highlight: false,
  },
  pro: {
    name: "Pro",
    price: 29,
    originalPrice: 39,
    credits: 150,
    features: ["150 credits/month", "All 6 tools", "HD + 4K quality", "Image-to-video", "All templates", "Caption studio"],
    cta: "Get Pro",
    highlight: true,
  },
};

export type VideoQuality = "standard" | "hd" | "premium";

export interface VideoTier {
  label: string;
  /** Short trade-off copy for the UI picker — "fast & affordable" isn't the
   *  same axis as "sharpest resolution" isn't the same axis as "best model
   *  quality", so price alone doesn't tell the story between these three. */
  blurb: string;
  model: string;
  resolution: "480p" | "720p" | "1080p";
  durationSeconds: number;
  apiCost: number;
  creditCost: number;
  minPlan: Plan;
}

// Three real, distinct options rather than one fixed config or a strict
// price ladder — verified against fal's API docs (not recalled) before
// picking numbers. Notably hd (Wan 2.5, 1080p) costs LESS than premium
// (Seedance 2.5, 720p): a different, cheaper model happens to beat the
// "premium" pick on resolution too. That's real, not a pricing mistake —
// see the explicit test in lib/plans.test.ts asserting it stays that way.
export const VIDEO_TIERS: Record<VideoQuality, VideoTier> = {
  standard: {
    label: "Standard",
    blurb: "Fast & affordable",
    model: "bytedance/seedance-2.0/mini/image-to-video",
    resolution: "720p",
    durationSeconds: 5,
    apiCost: 0.77,
    creditCost: 29,
    minPlan: "pro",
  },
  hd: {
    label: "HD 1080p",
    blurb: "Sharpest resolution",
    model: "fal-ai/wan-25-preview/image-to-video",
    resolution: "1080p",
    durationSeconds: 5,
    apiCost: 0.75,
    creditCost: 28,
    minPlan: "pro",
  },
  premium: {
    label: "Premium",
    blurb: "Best model quality",
    model: "bytedance/seedance-2.5/image-to-video",
    resolution: "720p",
    durationSeconds: 5,
    apiCost: 2.37,
    creditCost: 88,
    minPlan: "pro",
  },
};

const PLAN_RANK: Record<Plan, number> = { free: 0, basic: 1, pro: 2 };

/** True if `plan` meets or exceeds `required` — e.g. isPlanAtLeast("pro", "basic") === true. */
export function isPlanAtLeast(plan: Plan, required: Plan): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[required];
}

export function canUseQuality(plan: Plan, quality: Quality): boolean {
  return isPlanAtLeast(plan, QUALITY_TIERS[quality].minPlan);
}

export function canUseVideoQuality(plan: Plan, quality: VideoQuality): boolean {
  return isPlanAtLeast(plan, VIDEO_TIERS[quality].minPlan);
}
