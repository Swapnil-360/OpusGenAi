import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  recordWebhookEvent,
  markWebhookProcessed,
  syncSubscription,
  renewSubscriptionCredits,
  cancelSubscription,
} from "./billing";
import { grantCredits } from "./credits";

const fromMock = vi.fn();
const rpcMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (...a: unknown[]) => fromMock(...a),
    rpc: (...a: unknown[]) => rpcMock(...a),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("grantCredits", () => {
  it("rejects non-positive amounts immediately", async () => {
    expect(await grantCredits("u1", 0, "purchase", "zero credits")).toBeNull();
    expect(
      await grantCredits("u1", -5, "purchase", "negative credits"),
    ).toBeNull();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("calls refund_credits rpc and inserts a credit_transaction", async () => {
    rpcMock.mockResolvedValue({ data: 55, error: null });
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ insert: insertMock });

    const result = await grantCredits(
      "u1",
      50,
      "purchase",
      "Bought 50 credits",
    );
    expect(result).toBe(55);
    expect(rpcMock).toHaveBeenCalledWith("refund_credits", {
      uid: "u1",
      amount: 50,
    });
    expect(fromMock).toHaveBeenCalledWith("credit_transactions");
    expect(insertMock).toHaveBeenCalledWith({
      user_id: "u1",
      amount: 50,
      type: "purchase",
      description: "Bought 50 credits",
    });
  });
});

describe("recordWebhookEvent", () => {
  it("records a new event successfully", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ insert: insertMock });

    const res = await recordWebhookEvent(
      "evt_123",
      "stripe",
      "invoice.payment_succeeded",
    );
    expect(res.isDuplicate).toBe(false);
    expect(fromMock).toHaveBeenCalledWith("webhook_events");
    expect(insertMock).toHaveBeenCalledWith({
      event_id: "evt_123",
      gateway: "stripe",
      event_type: "invoice.payment_succeeded",
      payload: undefined,
      status: "processing",
    });
  });

  it("detects duplicate events via unique constraint violation 23505", async () => {
    const insertMock = vi.fn().mockResolvedValue({
      error: {
        code: "23505",
        message: "duplicate key value violates unique constraint",
      },
    });
    fromMock.mockReturnValue({ insert: insertMock });

    const res = await recordWebhookEvent(
      "evt_duplicate",
      "stripe",
      "invoice.payment_succeeded",
    );
    expect(res.isDuplicate).toBe(true);
  });
});

describe("markWebhookProcessed", () => {
  it("updates status and timestamp on webhook_events", async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ update: updateMock });

    await markWebhookProcessed("evt_123", "processed");
    expect(fromMock).toHaveBeenCalledWith("webhook_events");
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "processed", error_message: null }),
    );
    expect(eqMock).toHaveBeenCalledWith("event_id", "evt_123");
  });
});

describe("syncSubscription", () => {
  it("updates customer, subscription, status, and period bounds on profiles", async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ update: updateMock });

    const ok = await syncSubscription({
      userId: "u1",
      customerId: "cus_123",
      subscriptionId: "sub_123",
      status: "active",
      plan: "pro",
      currentPeriodStart: "2026-08-01T00:00:00Z",
      currentPeriodEnd: "2026-09-01T00:00:00Z",
      cancelAtPeriodEnd: false,
    });

    expect(ok).toBe(true);
    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_customer_id: "cus_123",
        stripe_subscription_id: "sub_123",
        subscription_status: "active",
        plan: "pro",
        current_period_start: "2026-08-01T00:00:00Z",
        current_period_end: "2026-09-01T00:00:00Z",
        cancel_at_period_end: false,
      }),
    );
    expect(eqMock).toHaveBeenCalledWith("id", "u1");
  });
});

describe("renewSubscriptionCredits", () => {
  it("refills monthly credits for pro plan (150) and updates period bounds", async () => {
    rpcMock.mockResolvedValue({ data: 165, error: null });
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

    fromMock.mockImplementation((table: string) => {
      if (table === "credit_transactions") return { insert: insertMock };
      if (table === "profiles") return { update: updateMock };
      return {};
    });

    const newBalance = await renewSubscriptionCredits(
      "u1",
      "pro",
      "2026-09-01T00:00:00Z",
      "2026-10-01T00:00:00Z",
    );

    expect(newBalance).toBe(165);
    expect(rpcMock).toHaveBeenCalledWith("refund_credits", {
      uid: "u1",
      amount: 150,
    });
    expect(insertMock).toHaveBeenCalledWith({
      user_id: "u1",
      amount: 150,
      type: "subscription_renewal",
      description: "Pro plan monthly credit refill (+150 credits)",
    });
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        current_period_start: "2026-09-01T00:00:00Z",
        current_period_end: "2026-10-01T00:00:00Z",
      }),
    );
  });

  it("returns null for free plan", async () => {
    expect(await renewSubscriptionCredits("u1", "free")).toBeNull();
  });
});

describe("cancelSubscription", () => {
  it("sets cancel_at_period_end when canceling at end of period", async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ update: updateMock });

    const ok = await cancelSubscription("u1", true);
    expect(ok).toBe(true);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ cancel_at_period_end: true }),
    );
  });

  it("downgrades to free plan immediately when not waiting for period end", async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ update: updateMock });

    const ok = await cancelSubscription("u1", false);
    expect(ok).toBe(true);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: "free",
        subscription_status: "canceled",
        cancel_at_period_end: false,
      }),
    );
  });
});
