import { describe, expect, it } from "vitest";
import { daysAgo, parseYmd, ymd } from "./dates";

describe("dates", () => {
  it("formats and parses local days", () => {
    const d = new Date(2026, 9, 4, 23, 59);
    expect(ymd(d)).toBe("2026-10-04");
    expect(ymd(parseYmd("2026-10-04"))).toBe("2026-10-04");
  });
  it("steps back across a month boundary", () => {
    expect(ymd(daysAgo(5, new Date(2026, 9, 3)))).toBe("2026-09-28");
  });
});
