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

function makeAdminMock() {
  const update = vi.fn().mockReturnThis();
  const eq = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn().mockReturnValue({ update: (...a: unknown[]) => { update(...a); return { eq }; } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { from } as any;
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
    getUserCreditsMock.mockResolvedValue(5);
    refundCreditsMock.mockResolvedValue(15);
    const admin = makeAdminMock();
    const { settlePendingVideoRow } = await import("./video-status");

    const result = await settlePendingVideoRow(admin, { ...BASE_ROW, credit_cost: 88 }, "user@example.com");

    expect(result.status).toBe("failed");
    expect(refundCreditsMock).toHaveBeenCalledWith("user-1", 88, 5, expect.any(String));
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
