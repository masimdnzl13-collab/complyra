import { describe, expect, it } from "vitest";
import { getCurrentMonthKey } from "./monthly-quota";

describe("getCurrentMonthKey", () => {
  it("formats as YYYY-MM with a zero-padded month", () => {
    expect(getCurrentMonthKey(new Date("2026-03-15T12:00:00Z"))).toBe("2026-03");
  });

  it("pads single-digit months", () => {
    expect(getCurrentMonthKey(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01");
  });

  it("uses UTC, not local time, so a late-evening local timestamp near midnight doesn't roll to the wrong month", () => {
    // 2026-01-31T23:30 in UTC-5 is still 2026-02-01 in UTC.
    const date = new Date("2026-02-01T04:30:00Z");
    expect(getCurrentMonthKey(date)).toBe("2026-02");
  });

  it("rolls over correctly at a year boundary", () => {
    expect(getCurrentMonthKey(new Date("2025-12-31T23:59:59Z"))).toBe("2025-12");
    expect(getCurrentMonthKey(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01");
  });
});
