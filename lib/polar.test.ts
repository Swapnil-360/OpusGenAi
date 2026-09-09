import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  resolvePlanFromProductId,
  resolveProductIdFromPlan,
  POLAR_PRODUCT_IDS,
} from "./polar";
import { POST as checkoutHandler } from "@/app/api/checkout/route";
import { POST as portalHandler } from "@/app/api/customer-portal/route";
import { POST as webhookHandler } from "@/app/api/webhooks/polar/route";
import { NextRequest } from "next/server";

const getUserMock = vi.fn();
const clientFromMock = vi.fn();
const adminFromMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: getUserMock,
    },
    from: (...a: unknown[]) => clientFromMock(...a),
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (...a: unknown[]) => adminFromMock(...a),
  }),
}));

const checkoutCreateMock = vi.fn();
const customerSessionsCreateMock = vi.fn();

vi.mock("@/lib/polar", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./polar")>();
  return {
    ...actual,
    polar: {
      checkouts: {
        create: (...args: unknown[]) => checkoutCreateMock(...args),
      },
      customerSessions: {
        create: (...args: unknown[]) => customerSessionsCreateMock(...args),
      },
    },
  };
});

const validateEventMock = vi.fn();
vi.mock("@polar-sh/sdk/webhooks", () => {
  class MockWebhookVerificationError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "WebhookVerificationError";
    }
  }
  return {
    validateEvent: (...args: unknown[]) => validateEventMock(...args),
    WebhookVerificationError: MockWebhookVerificationError,
  };
});

const recordWebhookEventMock = vi.fn();
const syncSubscriptionMock = vi.fn();
const renewSubscriptionCreditsMock = vi.fn();
const cancelSubscriptionMock = vi.fn();
const markWebhookProcessedMock = vi.fn();

vi.mock("@/lib/billing", () => ({
  recordWebhookEvent: (...args: unknown[]) => recordWebhookEventMock(...args),
  syncSubscription: (...args: unknown[]) => syncSubscriptionMock(...args),
  renewSubscriptionCredits: (...args: unknown[]) =>
    renewSubscriptionCreditsMock(...args),
  cancelSubscription: (...args: unknown[]) => cancelSubscriptionMock(...args),
  markWebhookProcessed: (...args: unknown[]) =>
    markWebhookProcessedMock(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.POLAR_BASIC_PRODUCT_ID = "prod_basic_123";
  process.env.POLAR_PRO_PRODUCT_ID = "prod_pro_456";
  process.env.POLAR_WEBHOOK_SECRET = "whsec_test_secret";
  POLAR_PRODUCT_IDS.basic = "prod_basic_123";
  POLAR_PRODUCT_IDS.pro = "prod_pro_456";
});

describe("Polar Product ID Resolvers", () => {
  it("resolves product IDs for basic and pro plans", () => {
    expect(resolveProductIdFromPlan("basic")).toBe("prod_basic_123");
    expect(resolveProductIdFromPlan("pro")).toBe("prod_pro_456");
  });

  it("resolves plan names from product IDs", () => {
    expect(resolvePlanFromProductId("prod_basic_123")).toBe("basic");
    expect(resolvePlanFromProductId("prod_pro_456")).toBe("pro");
    expect(resolvePlanFromProductId("unknown")).toBeNull();
  });
});

describe("POST /api/checkout", () => {
  it("returns 401 when user is not authenticated", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest("http://localhost/api/checkout", {
      method: "POST",
      body: JSON.stringify({ plan: "basic" }),
    });
    const res = await checkoutHandler(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when an invalid plan is supplied", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: "u1@test.com" } },
    });
    const req = new NextRequest("http://localhost/api/checkout", {
      method: "POST",
      body: JSON.stringify({ plan: "unlimited" }),
    });
    const res = await checkoutHandler(req);
    expect(res.status).toBe(400);
  });

  it("creates a checkout session and returns url", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: "u1@test.com" } },
    });
    checkoutCreateMock.mockResolvedValue({
      url: "https://polar.sh/checkout/chk_123",
    });

    const req = new NextRequest("http://localhost/api/checkout", {
      method: "POST",
      body: JSON.stringify({ plan: "pro" }),
    });
    const res = await checkoutHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toBe("https://polar.sh/checkout/chk_123");
    expect(checkoutCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        products: ["prod_pro_456"],
        customerEmail: "u1@test.com",
        externalCustomerId: "u1",
        metadata: { userId: "u1", plan: "pro" },
      }),
    );
  });
});

describe("POST /api/customer-portal", () => {
  it("returns 401 when not logged in", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest("http://localhost/api/customer-portal", {
      method: "POST",
    });
    const res = await portalHandler(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 if user is on free plan with no customer id", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: "u1@test.com" } },
    });
    const singleMock = vi.fn().mockResolvedValue({
      data: { plan: "free", stripe_customer_id: null },
    });
    const eqMock = vi.fn().mockReturnValue({ single: singleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    adminFromMock.mockReturnValue({ select: selectMock });

    const req = new NextRequest("http://localhost/api/customer-portal", {
      method: "POST",
    });
    const res = await portalHandler(req);
    expect(res.status).toBe(400);
  });

  it("generates and returns a portal URL for subscribed user", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: "u1@test.com" } },
    });
    const singleMock = vi.fn().mockResolvedValue({
      data: { plan: "basic", stripe_customer_id: "cus_polar_123" },
    });
    const eqMock = vi.fn().mockReturnValue({ single: singleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    adminFromMock.mockReturnValue({ select: selectMock });

    customerSessionsCreateMock.mockResolvedValue({
      customerPortalUrl: "https://polar.sh/portal/cus_polar_123",
    });

    const req = new NextRequest("http://localhost/api/customer-portal", {
      method: "POST",
    });
    const res = await portalHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toBe("https://polar.sh/portal/cus_polar_123");
    expect(customerSessionsCreateMock).toHaveBeenCalledWith({
      customerId: "cus_polar_123",
    });
  });
});

describe("POST /api/webhooks/polar", () => {
  it("returns 403 when signature validation fails", async () => {
    const { WebhookVerificationError } = await import("@polar-sh/sdk/webhooks");
    validateEventMock.mockImplementation(() => {
      throw new WebhookVerificationError("Bad signature");
    });

    const req = new NextRequest("http://localhost/api/webhooks/polar", {
      method: "POST",
      body: "{}",
    });
    const res = await webhookHandler(req);
    expect(res.status).toBe(403);
  });

  it("handles duplicate webhook events gracefully (idempotency)", async () => {
    validateEventMock.mockReturnValue({
      type: "subscription.created",
      data: {},
    });
    recordWebhookEventMock.mockResolvedValue({ isDuplicate: true });

    const req = new NextRequest("http://localhost/api/webhooks/polar", {
      method: "POST",
      body: "{}",
      headers: { "webhook-id": "evt_123" },
    });
    const res = await webhookHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.duplicate).toBe(true);
    expect(syncSubscriptionMock).not.toHaveBeenCalled();
  });

  it("processes subscription.created: syncs profile and refills credits", async () => {
    validateEventMock.mockReturnValue({
      type: "subscription.created",
      data: {
        id: "sub_123",
        customerId: "cus_123",
        status: "active",
        productId: "prod_basic_123",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
        customer: { externalId: "user_abc", email: "abc@test.com" },
        metadata: { userId: "user_abc", plan: "basic" },
      },
    });

    recordWebhookEventMock.mockResolvedValue({ isDuplicate: false });
    syncSubscriptionMock.mockResolvedValue(true);
    renewSubscriptionCreditsMock.mockResolvedValue(50);

    const req = new NextRequest("http://localhost/api/webhooks/polar", {
      method: "POST",
      body: "{}",
      headers: { "webhook-id": "evt_fresh_1" },
    });

    const res = await webhookHandler(req);
    expect(res.status).toBe(200);

    expect(syncSubscriptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_abc",
        customerId: "cus_123",
        subscriptionId: "sub_123",
        status: "active",
        plan: "basic",
      }),
    );
    expect(renewSubscriptionCreditsMock).toHaveBeenCalledWith(
      "user_abc",
      "basic",
      expect.any(String),
      expect.any(String),
    );
    expect(markWebhookProcessedMock).toHaveBeenCalledWith(
      "evt_fresh_1",
      "processed",
    );
  });

  it("processes subscription.canceled: marks cancellation", async () => {
    validateEventMock.mockReturnValue({
      type: "subscription.canceled",
      data: {
        id: "sub_123",
        cancelAtPeriodEnd: true,
        customer: { externalId: "user_abc", email: "abc@test.com" },
        metadata: {},
      },
    });

    recordWebhookEventMock.mockResolvedValue({ isDuplicate: false });
    cancelSubscriptionMock.mockResolvedValue(true);

    const req = new NextRequest("http://localhost/api/webhooks/polar", {
      method: "POST",
      body: "{}",
      headers: { "webhook-id": "evt_cancel_1" },
    });

    const res = await webhookHandler(req);
    expect(res.status).toBe(200);
    expect(cancelSubscriptionMock).toHaveBeenCalledWith("user_abc", true);
    expect(markWebhookProcessedMock).toHaveBeenCalledWith(
      "evt_cancel_1",
      "processed",
    );
  });
});
