import { describe, expect, it } from "vitest";
import { cleanOrder, DEFAULT_ORDER } from "./MovableTiles";

describe("cleanOrder", () => {
  it("keeps a valid saved order", () => {
    expect(cleanOrder(["done", "links", "agenda", "time", "activity"])).toEqual(["done", "links", "agenda", "time", "activity"]);
  });
  it("drops unknown and repeated ids and appends missing ones", () => {
    expect(cleanOrder(["time", "nope", "time", "done"])).toEqual(["time", "done", "agenda", "links", "activity"]);
  });
  it("falls back to the default for junk", () => {
    expect(cleanOrder(null)).toEqual(DEFAULT_ORDER);
    expect(cleanOrder("x")).toEqual(DEFAULT_ORDER);
  });
});
