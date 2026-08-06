import { describe, expect, it } from "vitest";
import { hasUnlimitedCredits, UNLIMITED_CREDITS_DISPLAY } from "./credits";
import { ADMIN_EMAILS } from "./admin-config";

describe("hasUnlimitedCredits", () => {
  it("grants unlimited credits to every configured admin email", () => {
    for (const email of ADMIN_EMAILS) {
      expect(hasUnlimitedCredits(email)).toBe(true);
    }
  });

  it("is case-insensitive — Supabase doesn't normalize email casing for us", () => {
    expect(hasUnlimitedCredits(ADMIN_EMAILS[0].toUpperCase())).toBe(true);
  });

  it("denies a real but non-admin email", () => {
    expect(hasUnlimitedCredits("random.customer@example.com")).toBe(false);
  });

  it("denies null/undefined/empty without throwing — the auth call site can pass any of these", () => {
    expect(hasUnlimitedCredits(null)).toBe(false);
    expect(hasUnlimitedCredits(undefined)).toBe(false);
    expect(hasUnlimitedCredits("")).toBe(false);
  });

  it("does not match on substring — a bug here would grant unlimited credits too broadly", () => {
    expect(hasUnlimitedCredits(`prefix-${ADMIN_EMAILS[0]}`)).toBe(false);
    expect(hasUnlimitedCredits(`${ADMIN_EMAILS[0]}.evil.com`)).toBe(false);
  });
});

describe("UNLIMITED_CREDITS_DISPLAY", () => {
  it("is comfortably above the low-credit warning threshold", () => {
    // Regression guard for the bug fixed earlier this session: admins were
    // shown their real (low) balance after an action, tripping the
    // low-credit toast. Any value here must clear that threshold by a wide
    // margin, not just by one.
    expect(UNLIMITED_CREDITS_DISPLAY).toBeGreaterThan(1000);
  });
});
