import { Polar } from "@polar-sh/sdk";
import { type Plan } from "@/lib/plans";

/**
 * Singleton instance of Polar SDK client.
 * Defaults to "sandbox" server if POLAR_SERVER is not explicitly "production".
 */
export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
  server: process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
});

export const POLAR_PRODUCT_IDS: Record<"basic" | "pro", string> = {
  basic: process.env.POLAR_BASIC_PRODUCT_ID ?? "",
  pro: process.env.POLAR_PRO_PRODUCT_ID ?? "",
};

export function resolveProductIdFromPlan(plan: "basic" | "pro"): string | null {
  const id = POLAR_PRODUCT_IDS[plan];
  return id && id.length > 0 ? id : null;
}

export function resolvePlanFromProductId(productId: string): Plan | null {
  if (POLAR_PRODUCT_IDS.basic && productId === POLAR_PRODUCT_IDS.basic) return "basic";
  if (POLAR_PRODUCT_IDS.pro && productId === POLAR_PRODUCT_IDS.pro) return "pro";
  return null;
}
