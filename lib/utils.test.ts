import { describe, expect, it } from "vitest";
import { cn, formatTimeAgo, formatDate, truncate, planLabel, planCredits, planPrice } from "./utils";

describe("cn", () => {
  it("merges conflicting Tailwind classes, keeping the last one — this is the whole point of tailwind-merge", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});

describe("formatTimeAgo", () => {
  it("says 'just now' under a minute", () => {
    expect(formatTimeAgo(new Date(Date.now() - 5_000))).toBe("just now");
  });

  it("uses minutes between 1 and 59 minutes", () => {
    expect(formatTimeAgo(new Date(Date.now() - 5 * 60_000))).toBe("5m ago");
  });

  it("uses hours between 1 and 23 hours", () => {
    expect(formatTimeAgo(new Date(Date.now() - 3 * 3_600_000))).toBe("3h ago");
  });

  it("uses days between 1 and 29 days", () => {
    expect(formatTimeAgo(new Date(Date.now() - 5 * 86_400_000))).toBe("5d ago");
  });

  it("falls back to a calendar date at 30+ days — history entries won't say '90d ago' forever", () => {
    const old = new Date(Date.now() - 90 * 86_400_000);
    expect(formatTimeAgo(old)).toBe(old.toLocaleDateString());
  });
});

describe("formatDate", () => {
  it("formats as 'Mon D, YYYY'", () => {
    // Local midnight, not UTC — avoids a date rolling back a day near UTC
    // boundaries depending on the machine's timezone.
    expect(formatDate(new Date(2026, 0, 15))).toBe("Jan 15, 2026");
  });
});

describe("truncate", () => {
  it("leaves short strings untouched", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("cuts and adds an ellipsis when over the limit", () => {
    expect(truncate("hello world", 5)).toBe("hello…");
  });

  it("is exact at the boundary — length === limit doesn't truncate", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });
});

describe("plan* lookups", () => {
  it("cover exactly the three real plans with sane, increasing figures", () => {
    for (const plan of ["free", "basic", "pro"] as const) {
      expect(planLabel(plan)).toBeTruthy();
      expect(planCredits(plan)).toBeGreaterThan(0);
      expect(planPrice(plan)).toBeGreaterThanOrEqual(0);
    }
    // Higher tiers must actually be worth upgrading to — a real business bug
    // if a lower plan ever quietly out-priced or out-valued a higher one.
    expect(planCredits("basic")).toBeGreaterThan(planCredits("free"));
    expect(planCredits("pro")).toBeGreaterThan(planCredits("basic"));
    expect(planPrice("basic")).toBeGreaterThan(planPrice("free"));
    expect(planPrice("pro")).toBeGreaterThan(planPrice("basic"));
  });
});
