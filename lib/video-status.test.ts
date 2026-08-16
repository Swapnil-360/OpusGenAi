import { describe, expect, it, vi, beforeEach } from "vitest";
import { VIDEO_TIERS } from "@/lib/plans";

const queueStatusMock = vi.fn();
const queueResultMock = vi.fn();
vi.mock("@/lib/fal", () => ({
  fal: { queue: { status: (...a: unknown[]) => queueStatusMock(...a), result: (...a: unknown[]) => queueResultMock(...a) } },
}));

const getUserCreditsMock = vi.fn();
const refundCreditsMock = vi.fn();
const hasUnlimitedCreditsMock = vi.fn();
vi.mock("@/lib/credits", () => ({
  getUserCredits: (...a: unknown[]) => getUserCreditsMock(...a),
  refundCredits: (...a: unknown[]) => refundCreditsMock(...a),
  hasUnlimitedCredits: (...a: unknown[]) => hasUnlimitedCreditsMock(...a),
}));

/**
 * Minimal stand-in for the supabase-js query builder.
 *
 * Both chains this module builds have to work: the completion write
 * (`update().eq().eq()`, awaited directly) and the failure claim
 * (`update().eq().eq().select().maybeSingle()`), which is what makes a refund
 * happen at most once. `claimed` controls whether this mock represents the
 * caller that won that claim — pass false to simulate another request having
 * already settled the row.
 */
function makeAdminMock({ claimed = true, creditCost = 10 }: { claimed?: boolean; creditCost?: number } = {}) {
  const update = vi.fn();
  const maybeSingle = vi.fn().mockResolvedValue({
    data: claimed ? { id: "gen-1", credit_cost: creditCost } : null,
    error: null,
  });

  // Every .eq() returns a thenable that is also chainable, so the same object
  // serves an awaited two-.eq() chain and one that continues into .select().
  const chain: Record<string, unknown> = {
    eq: () => chain,
    select: () => ({ maybeSingle }),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve),
  };

  const from = vi.fn().mockReturnValue({
    update: (...a: unknown[]) => { update(...a); return chain; },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { from, update, maybeSingle } as any;
}

const BASE_ROW = {
  id: "gen-1",
  user_id: "user-1",
  status: "pending",
  error_message: null,
  credit_cost: 10,
  metadata: { quality: "standard", requestId: "req-1", resolution: "720p", durationSeconds: 5 },
};

describe("resolveVideoModel", () => {
  it("prefers the row's own stored model when present", async () => {
    const { resolveVideoModel } = await import("./video-status");
    expect(resolveVideoModel({ model: "some/custom/model", resolution: "720p", durationSeconds: 5 })).toBe("some/custom/model");
  });

  it("falls back to VIDEO_TIERS by quality for older rows with no stored model", async () => {
    const { resolveVideoModel } = await import("./video-status");
    expect(resolveVideoModel({ quality: "premium", resolution: "720p", durationSeconds: 5 })).toBe(VIDEO_TIERS.premium.model);
  });

  it("falls back to standard when quality is missing entirely (the oldest rows)", async () => {
    const { resolveVideoModel } = await import("./video-status");
    expect(resolveVideoModel({ resolution: "720p", durationSeconds: 5 })).toBe(VIDEO_TIERS.standard.model);
  });
});

describe("settlePendingVideoRow", () => {
  beforeEach(() => {
    queueStatusMock.mockReset();
    queueResultMock.mockReset();
    getUserCreditsMock.mockReset();
    refundCreditsMock.mockReset();
    hasUnlimitedCreditsMock.mockReset();
  });

  it("leaves a still-in-progress job untouched — no DB write, status stays pending", async () => {
    queueStatusMock.mockResolvedValue({ status: "IN_PROGRESS" });
    const admin = makeAdminMock();
    const { settlePendingVideoRow } = await import("./video-status");

    const result = await settlePendingVideoRow(admin, BASE_ROW, "user@example.com");

    expect(result).toEqual({ status: "pending" });
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("returns pending without calling fal at all when the row has no requestId yet", async () => {
    const admin = makeAdminMock();
    const { settlePendingVideoRow } = await import("./video-status");

    const result = await settlePendingVideoRow(
      admin,
      { ...BASE_ROW, metadata: { quality: "standard", resolution: "720p", durationSeconds: 5 } },
      "user@example.com"
    );

    expect(result).toEqual({ status: "pending" });
    expect(queueStatusMock).not.toHaveBeenCalled();
  });

  it("marks completed and never refunds when fal reports the job finished", async () => {
    queueStatusMock.mockResolvedValue({ status: "COMPLETED" });
    queueResultMock.mockResolvedValue({ data: { video: { url: "https://fal.media/clip.mp4" } } });
    const admin = makeAdminMock();
    const { settlePendingVideoRow } = await import("./video-status");

    const result = await settlePendingVideoRow(admin, BASE_ROW, "user@example.com");

    expect(result).toEqual({ status: "completed", videoUrl: "https://fal.media/clip.mp4" });
    expect(refundCreditsMock).not.toHaveBeenCalled();
    expect(admin.from).toHaveBeenCalledWith("generations");
  });

  it("marks failed and refunds the row's actual credit_cost (not a tier constant) when fal errors", async () => {
    queueStatusMock.mockRejectedValue(new Error("fal blew up"));
    hasUnlimitedCreditsMock.mockReturnValue(false);
    refundCreditsMock.mockResolvedValue(103);
    // The amount comes from the row the claiming UPDATE returned, so the mock
    // reports the same cost the row carries.
    const admin = makeAdminMock({ creditCost: 88 });
    const { settlePendingVideoRow } = await import("./video-status");

    const result = await settlePendingVideoRow(admin, { ...BASE_ROW, credit_cost: 88 }, "user@example.com");

    expect(result.status).toBe("failed");
    expect(refundCreditsMock).toHaveBeenCalledWith("user-1", 88, expect.any(String));
  });

  it("refunds nothing when another caller already settled the row — a failed job must not be refunded twice", async () => {
    // The live status poll, History's reconciliation pass and the cancel route
    // can all try to settle the same generation at once. Only the caller whose
    // UPDATE actually moves the row out of `pending` may refund it.
    queueStatusMock.mockRejectedValue(new Error("fal blew up"));
    hasUnlimitedCreditsMock.mockReturnValue(false);
    const admin = makeAdminMock({ claimed: false });
    const { settlePendingVideoRow } = await import("./video-status");

    const result = await settlePendingVideoRow(admin, BASE_ROW, "user@example.com");

    expect(result.status).toBe("failed");
    expect(refundCreditsMock).not.toHaveBeenCalled();
  });

  it("does not refund an unlimited (admin) account on failure", async () => {
    queueStatusMock.mockRejectedValue(new Error("fal blew up"));
    hasUnlimitedCreditsMock.mockReturnValue(true);
    const admin = makeAdminMock();
    const { settlePendingVideoRow } = await import("./video-status");

    await settlePendingVideoRow(admin, BASE_ROW, "admin@example.com");

    expect(refundCreditsMock).not.toHaveBeenCalled();
  });

  it("fails the row (rather than throwing) when fal reports COMPLETED but the result has no video URL", async () => {
    queueStatusMock.mockResolvedValue({ status: "COMPLETED" });
    queueResultMock.mockResolvedValue({ data: {} });
    hasUnlimitedCreditsMock.mockReturnValue(false);
    getUserCreditsMock.mockResolvedValue(0);
    refundCreditsMock.mockResolvedValue(10);
    const admin = makeAdminMock();
    const { settlePendingVideoRow } = await import("./video-status");

    const result = await settlePendingVideoRow(admin, BASE_ROW, "user@example.com");

    expect(result.status).toBe("failed");
    expect(refundCreditsMock).toHaveBeenCalled();
  });
});
