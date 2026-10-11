import { describe, expect, it } from "vitest";
import { isAuthorizedCron } from "@/lib/auth";

describe("isAuthorizedCron", () => {
  const secret = "s3cret-value";

  it("rejects a missing header", () => {
    expect(isAuthorizedCron(null, secret)).toBe(false);
  });

  it("rejects a wrong secret", () => {
    expect(isAuthorizedCron("Bearer wrong", secret)).toBe(false);
    expect(isAuthorizedCron(secret, secret)).toBe(false);
  });

  it("rejects everything when CRON_SECRET is not configured", () => {
    expect(isAuthorizedCron("Bearer ", undefined)).toBe(false);
    expect(isAuthorizedCron("Bearer ", "")).toBe(false);
  });

  it("accepts the correct secret", () => {
    expect(isAuthorizedCron(`Bearer ${secret}`, secret)).toBe(true);
  });
});
