import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// `unstable_cache`/`revalidateTag` are Next.js's own Data Cache primitives —
// they depend on request-scoped storage that only exists inside a running
// Next.js server, which this Vitest suite (plain node environment, no Next
// runtime) does not provide. Mocking the module is the standard way to unit
// test code built on top of it: these tests verify *this file's* logic (the
// cache-aside wrapper, the error fallback, the tag/TTL plumbing), not
// Next.js's own caching behavior, which isn't this app's code to test.
const unstableCacheMock = vi.fn();
const revalidateTagMock = vi.fn();

vi.mock("next/cache", () => ({
  unstable_cache: (...args: unknown[]) => unstableCacheMock(...args),
  revalidateTag: (...args: unknown[]) => revalidateTagMock(...args),
}));

describe("cachedQuery", () => {
  beforeEach(() => {
    vi.resetModules();
    unstableCacheMock.mockReset();
    revalidateTagMock.mockReset();
  });

  it("returns the cached function's result on a normal call — the cache-aside happy path", async () => {
    const fetcher = vi.fn(async () => ({ value: 42 }));
    // unstable_cache(fn, keyParts, opts) returns the wrapped, callable function.
    unstableCacheMock.mockImplementation((fn: () => Promise<unknown>) => fn);

    const { cachedQuery } = await import("./cache");
    const getData = cachedQuery(fetcher, ["k"], { tags: ["t"], revalidateSeconds: 60 });

    await expect(getData()).resolves.toEqual({ value: 42 });
    expect(unstableCacheMock).toHaveBeenCalledWith(fetcher, ["k"], { tags: ["t"], revalidate: 60 });
  });

  it("passes keyParts and options straight through to unstable_cache unchanged — wrong dimensions here would let one user's cached entry answer for another's", async () => {
    const fetcher = vi.fn(async () => "x");
    unstableCacheMock.mockImplementation((fn: () => Promise<unknown>) => fn);

    const { cachedQuery } = await import("./cache");
    cachedQuery(fetcher, ["templates", "all"], { tags: ["templates"], revalidateSeconds: 1800 });

    expect(unstableCacheMock).toHaveBeenCalledWith(fetcher, ["templates", "all"], {
      tags: ["templates"],
      revalidate: 1800,
    });
  });

  it("falls back to calling the fetcher directly if the cache layer itself throws — a caching bug must never take the route down", async () => {
    const fetcher = vi.fn(async () => "fresh-from-db");
    // Simulate the Data Cache throwing on read.
    unstableCacheMock.mockImplementation(() => async () => {
      throw new Error("cache backend unavailable");
    });

    const { cachedQuery } = await import("./cache");
    const getData = cachedQuery(fetcher, ["k"], { tags: ["t"], revalidateSeconds: 60 });

    await expect(getData()).resolves.toBe("fresh-from-db");
    expect(fetcher).toHaveBeenCalledTimes(1); // the fallback path, not the (broken) cached path
  });

  it("lets a genuine database error from the fallback propagate — must not be silently swallowed into an empty/wrong result", async () => {
    const dbError = new Error("connection refused");
    const fetcher = vi.fn(async () => { throw dbError; });
    unstableCacheMock.mockImplementation(() => async () => { throw new Error("cache down too"); });

    const { cachedQuery } = await import("./cache");
    const getData = cachedQuery(fetcher, ["k"], { tags: ["t"], revalidateSeconds: 60 });

    await expect(getData()).rejects.toBe(dbError);
  });
});

describe("invalidateTemplatesCache", () => {
  beforeEach(() => {
    vi.resetModules();
    unstableCacheMock.mockReset();
    revalidateTagMock.mockReset();
  });

  it("revalidates exactly the templates tag", async () => {
    const { invalidateTemplatesCache, CACHE_TAGS } = await import("./cache");
    invalidateTemplatesCache();
    expect(revalidateTagMock).toHaveBeenCalledTimes(1);
    expect(revalidateTagMock).toHaveBeenCalledWith(CACHE_TAGS.templates);
  });

  it("does not throw even if revalidateTag itself throws — a failed invalidation must not fail the mutation that already succeeded in the database", async () => {
    revalidateTagMock.mockImplementation(() => { throw new Error("revalidate boom"); });
    const { invalidateTemplatesCache } = await import("./cache");
    expect(() => invalidateTemplatesCache()).not.toThrow();
  });
});

describe("CACHE_TTL", () => {
  const ENV_KEYS = ["CACHE_TTL_TEMPLATES_SECONDS", "CACHE_TTL_ADMIN_OVERVIEW_SECONDS"] as const;
  const original: Record<string, string | undefined> = {};

  beforeEach(() => {
    vi.resetModules();
    for (const k of ENV_KEYS) { original[k] = process.env[k]; delete process.env[k]; }
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (original[k] === undefined) delete process.env[k];
      else process.env[k] = original[k];
    }
  });

  it("falls back to sane defaults when no env override is set", async () => {
    const { CACHE_TTL } = await import("./cache");
    expect(CACHE_TTL.templates).toBe(1800);
    expect(CACHE_TTL.adminOverview).toBe(60);
  });

  it("honors a valid env override — this is how TTLs get tuned without a code change", async () => {
    process.env.CACHE_TTL_TEMPLATES_SECONDS = "300";
    const { CACHE_TTL } = await import("./cache");
    expect(CACHE_TTL.templates).toBe(300);
  });

  it("ignores a garbage/non-numeric override rather than caching with an invalid TTL", async () => {
    process.env.CACHE_TTL_TEMPLATES_SECONDS = "not-a-number";
    const { CACHE_TTL } = await import("./cache");
    expect(CACHE_TTL.templates).toBe(1800);
  });

  it("ignores a zero or negative override — a 0s or negative TTL would defeat the purpose of caching or throw inside unstable_cache", async () => {
    process.env.CACHE_TTL_TEMPLATES_SECONDS = "0";
    const zero = await import("./cache");
    expect(zero.CACHE_TTL.templates).toBe(1800);

    vi.resetModules();
    process.env.CACHE_TTL_TEMPLATES_SECONDS = "-30";
    const negative = await import("./cache");
    expect(negative.CACHE_TTL.templates).toBe(1800);
  });
});
