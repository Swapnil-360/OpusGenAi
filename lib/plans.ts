export type Plan = "free" | "basic" | "pro";

export type Quality = "standard" | "hd" | "ultra";

export interface QualityTier {
  /** fal.ai model endpoint. */
  model: string;
  /** Human-readable model name for display — `model` is a raw fal endpoint
   *  path, not something to show a user directly. */
  modelLabel: string;
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
    modelLabel: "Gemini 2.5 Flash",
    apiCost: 0.039,
    creditCost: 3,
    minPlan: "free",
  },
  hd: {
    model: "fal-ai/nano-banana-2/edit",
    modelLabel: "Nano Banana 2",
    resolution: "2K",
    apiCost: 0.12,
    creditCost: 5,
    minPlan: "basic",
  },
  ultra: {
    model: "fal-ai/nano-banana-2/edit",
    modelLabel: "Nano Banana 2",
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
  /** Raw fal.ai endpoint ID — what the server actually calls. */
  model: string;
  /** Human-readable model name for display — `model` is a fal endpoint path
   *  (e.g. "bytedance/seedance-2.0/mini/image-to-video"), not something to
   *  show a user directly. */
  modelLabel: string;
  /** All three current models generate synchronized audio natively (the
   *  route always sends generate_audio: true) — there is no separate "audio
   *  model"; this just documents that the video model itself produces it. */
  includesAudio: boolean;
  resolution: "480p" | "720p" | "1080p";
  durationSeconds: number;
  apiCost: number;
  creditCost: number;
  minPlan: Plan;
}

// Three real, distinct options rather than one fixed config or a strict
// price ladder — verified against fal's API docs (not recalled) before
// picking numbers.
//
// Deliberately priced at ~50-68% margin, well below the ~85%+ band used for
// images (QUALITY_TIERS) — video is Pro's headline feature, so the credit
// cost was cut from an initial 85%-margin pass (29/28/88) down to this one
// specifically to maximize how much video a Pro subscriber actually gets for
// $29/150cr (now ~12-15 clips/month on Standard or HD, ~6 on Premium, versus
// 3-5 before) rather than maximizing per-clip profit. Confirmed the resulting
// worst-case blended Pro margin (a user who spends the whole month on nothing
// but Premium video) still lands ~51% overall — profitable, not a giveaway.
//
// Note hd is priced ABOVE standard by credits despite a slightly LOWER real
// API cost (Wan 2.5 1080p $0.75 vs Seedance 2.0 mini 720p $0.77) — that's
// value-based pricing (sharper resolution commands a premium), not cost-based;
// a deliberate choice, not the cost-ordering bug the phrasing might suggest.
export const VIDEO_TIERS: Record<VideoQuality, VideoTier> = {
  standard: {
    label: "Standard",
    blurb: "Fast & affordable",
    model: "bytedance/seedance-2.0/mini/image-to-video",
    modelLabel: "Seedance 2.0 Mini",
    includesAudio: true,
    resolution: "720p",
    durationSeconds: 5,
    apiCost: 0.77,
    creditCost: 10,
    minPlan: "pro",
  },
  hd: {
    label: "HD 1080p",
    blurb: "Sharpest resolution",
    model: "fal-ai/wan-25-preview/image-to-video",
    modelLabel: "Wan 2.5",
    includesAudio: true,
    resolution: "1080p",
    durationSeconds: 5,
    apiCost: 0.75,
    creditCost: 12,
    minPlan: "pro",
  },
  premium: {
    label: "Premium",
    blurb: "Best model quality",
    model: "bytedance/seedance-2.5/image-to-video",
    modelLabel: "Seedance 2.5",
    includesAudio: true,
    resolution: "720p",
    durationSeconds: 5,
    apiCost: 2.37,
    creditCost: 25,
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
