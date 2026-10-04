import { describe, expect, it } from "vitest";
import { greeting, timeAgo } from "./time";

describe("timeAgo", () => {
  const now = 1_000_000_000_000;
  it("rounds to the friendliest unit", () => {
    expect(timeAgo(now - 10_000, now)).toBe("just now");
    expect(timeAgo(now - 5 * 60_000, now)).toBe("5 min ago");
    expect(timeAgo(now - 3 * 3_600_000, now)).toBe("3 h ago");
    expect(timeAgo(now - 24 * 3_600_000, now)).toBe("yesterday");
    expect(timeAgo(now - 72 * 3_600_000, now)).toBe("3 days ago");
  });
});

describe("greeting", () => {
  it("follows the clock", () => {
    expect(greeting(3)).toBe("Still up?");
    expect(greeting(9)).toBe("Good morning");
    expect(greeting(14)).toBe("Good afternoon");
    expect(greeting(20)).toBe("Good evening");
  });
});
