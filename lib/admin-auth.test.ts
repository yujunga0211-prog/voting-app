import { describe, expect, it } from "vitest";
import { checkAdminPassword, signAdminSession, verifyAdminSession } from "@/lib/admin-auth";

const SECRET = "Artificial";
const NOW = Date.parse("2026-09-28T12:00:00+09:00");
const HOUR = 60 * 60 * 1000;

describe("checkAdminPassword", () => {
  it("accepts the exact Admin password", () => {
    expect(checkAdminPassword("Artificial", SECRET)).toBe(true);
  });

  it("rejects a wrong, differently-cased or empty password", () => {
    expect(checkAdminPassword("artificial", SECRET)).toBe(false);
    expect(checkAdminPassword("Artificial ", SECRET)).toBe(false);
    expect(checkAdminPassword("", SECRET)).toBe(false);
  });

  it("rejects everything when no Admin password is configured", () => {
    expect(checkAdminPassword("", undefined)).toBe(false);
    expect(checkAdminPassword("", "")).toBe(false);
  });
});

describe("Admin session token", () => {
  it("verifies a token it signed until it expires", () => {
    const token = signAdminSession(SECRET, NOW + HOUR);
    expect(verifyAdminSession(SECRET, token, NOW)).toBe(true);
    expect(verifyAdminSession(SECRET, token, NOW + HOUR - 1)).toBe(true);
    expect(verifyAdminSession(SECRET, token, NOW + HOUR)).toBe(false);
  });

  it("rejects a token after the Admin password changes", () => {
    const token = signAdminSession(SECRET, NOW + HOUR);
    expect(verifyAdminSession("NewPassword", token, NOW)).toBe(false);
  });

  it("rejects a token whose expiry was tampered with", () => {
    const [, signature] = signAdminSession(SECRET, NOW + HOUR).split(".");
    expect(verifyAdminSession(SECRET, `${NOW + 100 * HOUR}.${signature}`, NOW)).toBe(false);
  });

  it("rejects missing or malformed tokens and a missing secret", () => {
    expect(verifyAdminSession(SECRET, undefined, NOW)).toBe(false);
    expect(verifyAdminSession(SECRET, "", NOW)).toBe(false);
    expect(verifyAdminSession(SECRET, "garbage", NOW)).toBe(false);
    expect(verifyAdminSession(undefined, signAdminSession(SECRET, NOW + HOUR), NOW)).toBe(false);
  });
});
