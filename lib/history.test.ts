import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, DELETE } from "@/app/api/history/route";
import { pruneUserHistory, MAX_USER_HISTORY } from "@/lib/history-limit";

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

vi.mock("@/lib/video-status", () => ({
  settlePendingVideoRow: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("pruneUserHistory", () => {
  it("returns 0 if userId is empty", async () => {
    const res = await pruneUserHistory(undefined, "");
    expect(res).toEqual({ prunedCount: 0, totalRemaining: 0 });
  });

  it("does nothing if user has <= keepLimit generations", async () => {
    const mockGens = Array.from({ length: 15 }, (_, i) => ({
      id: `gen_${i}`,
      status: "completed",
      created_at: new Date(Date.now() - i * 1000).toISOString(),
    }));

    const orderMock = vi.fn().mockResolvedValue({ data: mockGens, error: null });
    const neqMock = vi.fn().mockReturnValue({ order: orderMock });
    const eqMock = vi.fn().mockReturnValue({ neq: neqMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    adminFromMock.mockReturnValue({ select: selectMock });

    const res = await pruneUserHistory(undefined, "user_123", 20);
    expect(res).toEqual({ prunedCount: 0, totalRemaining: 15 });
  });

  it("prunes excess generations older than 20 and unlinks credit_transactions", async () => {
    const mockGens = Array.from({ length: 25 }, (_, i) => ({
      id: `gen_${i}`,
      status: "completed",
      created_at: new Date(Date.now() - i * 1000).toISOString(),
    }));

    // Generations query
    const orderMock = vi.fn().mockResolvedValue({ data: mockGens, error: null });
    const neqMock = vi.fn().mockReturnValue({ order: orderMock });
    const eqMock = vi.fn().mockReturnValue({ neq: neqMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

    // Credit transactions unlink
    const updateInMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ in: updateInMock });

    // Generations delete
    const deleteEqMock = vi.fn().mockResolvedValue({ error: null });
    const deleteInMock = vi.fn().mockReturnValue({ eq: deleteEqMock });
    const deleteMock = vi.fn().mockReturnValue({ in: deleteInMock });

    adminFromMock.mockImplementation((table: string) => {
      if (table === "credit_transactions") {
        return { update: updateMock };
      }
      if (table === "generations") {
        return {
          select: selectMock,
          delete: deleteMock,
        };
      }
      return {};
    });

    const res = await pruneUserHistory(undefined, "user_123", 20);
    expect(res).toEqual({ prunedCount: 5, totalRemaining: 20 });

    const expectedDeletedIds = ["gen_20", "gen_21", "gen_22", "gen_23", "gen_24"];
    expect(updateInMock).toHaveBeenCalledWith("generation_id", expectedDeletedIds);
    expect(deleteInMock).toHaveBeenCalledWith("id", expectedDeletedIds);
    expect(deleteEqMock).toHaveBeenCalledWith("user_id", "user_123");
  });
});

describe("GET /api/history", () => {
  it("returns 401 when user is not signed in", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Not signed in");
  });

  it("prunes excess history, returns generations and redacts template prompt", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user_123", email: "test@example.com" } },
    });

    // pruneUserHistory mock
    const pruneOrderMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const pruneNeqMock = vi.fn().mockReturnValue({ order: pruneOrderMock });
    const pruneEqMock = vi.fn().mockReturnValue({ neq: pruneNeqMock });
    const pruneSelectMock = vi.fn().mockReturnValue({ eq: pruneEqMock });
    adminFromMock.mockReturnValue({ select: pruneSelectMock });

    const mockRows = [
      {
        id: "gen_1",
        tool_id: "image-generation",
        prompt: "A secret internal prompt",
        status: "completed",
        metadata: { templateId: "cinematic", userPrompt: "user custom input" },
        credit_cost: 1,
        error_message: null,
        created_at: new Date().toISOString(),
      },
      {
        id: "gen_2",
        tool_id: "image-generation",
        prompt: "Standard visible prompt",
        status: "completed",
        metadata: {},
        credit_cost: 1,
        error_message: null,
        created_at: new Date().toISOString(),
      },
    ];

    const limitMock = vi.fn().mockResolvedValue({ data: mockRows, error: null });
    const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
    const eqMock = vi.fn().mockReturnValue({ order: orderMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    clientFromMock.mockReturnValue({ select: selectMock });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.limit).toBe(MAX_USER_HISTORY);
    expect(json.generations[0].prompt).toBe("user custom input");
    expect(json.generations[1].prompt).toBe("Standard visible prompt");
  });
});

describe("DELETE /api/history", () => {
  it("returns 401 when not signed in", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const req = new Request("http://localhost/api/history?id=gen_1", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when neither id nor all=true is provided", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user_123" } },
    });
    const req = new Request("http://localhost/api/history", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Generation ID is required");
  });

  it("returns 404 if the generation does not exist or belong to user", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user_123" } },
    });

    const singleMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqUserMock = vi.fn().mockReturnValue({ single: singleMock });
    const eqIdMock = vi.fn().mockReturnValue({ eq: eqUserMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqIdMock });
    adminFromMock.mockReturnValue({ select: selectMock });

    const req = new Request("http://localhost/api/history?id=not_found", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    expect(res.status).toBe(404);
  });

  it("returns 400 if the generation is still pending", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user_123" } },
    });

    const singleMock = vi.fn().mockResolvedValue({
      data: { id: "gen_pending", status: "pending" },
      error: null,
    });
    const eqUserMock = vi.fn().mockReturnValue({ single: singleMock });
    const eqIdMock = vi.fn().mockReturnValue({ eq: eqUserMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqIdMock });
    adminFromMock.mockReturnValue({ select: selectMock });

    const req = new Request("http://localhost/api/history?id=gen_pending", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/cancel the active generation/i);
  });

  it("unlinks credit transactions and deletes the generation when valid", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user_123" } },
    });

    // 1. Select generation
    const singleMock = vi.fn().mockResolvedValue({
      data: { id: "gen_done", status: "completed" },
      error: null,
    });
    const eqUserMock = vi.fn().mockReturnValue({ single: singleMock });
    const eqIdMock = vi.fn().mockReturnValue({ eq: eqUserMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqIdMock });

    // 2. Unlink credit transaction
    const updateEqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });

    // 3. Delete generation
    const deleteEqUserMock = vi.fn().mockResolvedValue({ error: null });
    const deleteEqIdMock = vi.fn().mockReturnValue({ eq: deleteEqUserMock });
    const deleteMock = vi.fn().mockReturnValue({ eq: deleteEqIdMock });

    adminFromMock.mockImplementation((table: string) => {
      if (table === "credit_transactions") {
        return { update: updateMock };
      }
      if (table === "generations") {
        return {
          select: selectMock,
          delete: deleteMock,
        };
      }
      return {};
    });

    const req = new Request("http://localhost/api/history?id=gen_done", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    expect(updateMock).toHaveBeenCalledWith({ generation_id: null });
    expect(updateEqMock).toHaveBeenCalledWith("generation_id", "gen_done");
    expect(deleteEqIdMock).toHaveBeenCalledWith("id", "gen_done");
    expect(deleteEqUserMock).toHaveBeenCalledWith("user_id", "user_123");
  });

  it("handles clearing all non-pending history (all=true)", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user_123" } },
    });

    const neqMock = vi.fn().mockResolvedValue({
      data: [{ id: "gen_1" }, { id: "gen_2" }],
      error: null,
    });
    const eqUserSelectMock = vi.fn().mockReturnValue({ neq: neqMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqUserSelectMock });

    const updateInMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ in: updateInMock });

    const deleteNeqMock = vi.fn().mockResolvedValue({ error: null });
    const deleteEqMock = vi.fn().mockReturnValue({ neq: deleteNeqMock });
    const deleteMock = vi.fn().mockReturnValue({ eq: deleteEqMock });

    adminFromMock.mockImplementation((table: string) => {
      if (table === "credit_transactions") {
        return { update: updateMock };
      }
      if (table === "generations") {
        return {
          select: selectMock,
          delete: deleteMock,
        };
      }
      return {};
    });

    const req = new Request("http://localhost/api/history?all=true", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.cleared).toBe(true);

    expect(updateInMock).toHaveBeenCalledWith("generation_id", ["gen_1", "gen_2"]);
    expect(deleteEqMock).toHaveBeenCalledWith("user_id", "user_123");
    expect(deleteNeqMock).toHaveBeenCalledWith("status", "pending");
  });
});
