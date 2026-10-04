import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { App } from "./App";

beforeAll(() => {
  // jsdom lacks these; Radix and the theme hook use them.
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
  window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never;
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});
afterEach(cleanup);

describe("Notes screen (against the in-memory shell)", () => {
  it("shows pinned notes apart from the rest, and the Today card", async () => {
    render(<App />);
    const pinned = await screen.findByRole("region", { name: "Pinned notes" });
    expect(within(pinned).getByRole("button", { name: "Loaf v1 scope" })).toBeTruthy();
    expect(within(screen.getByRole("region", { name: "Other notes" })).getByRole("button", { name: "Groceries" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Today" })).toBeTruthy();
  });

  it("unpinning moves a note out of Pinned", async () => {
    const user = userEvent.setup();
    render(<App />);
    const card = await screen.findByRole("button", { name: "Shortcuts I want" });
    await user.click(within(card).getByRole("button", { name: "Unpin" }));
    await waitFor(() => {
      const pinned = screen.getByRole("region", { name: "Pinned notes" });
      expect(within(pinned).queryByRole("button", { name: "Shortcuts I want" })).toBeNull();
    });
  });

  it("deleting a note offers Undo, and Undo brings it back", async () => {
    const user = userEvent.setup();
    render(<App />);
    const card = await screen.findByRole("button", { name: "Groceries" });
    await user.click(within(card).getByRole("button", { name: "Delete" }));
    await user.click(await screen.findByRole("button", { name: "Undo" }));
    expect(await screen.findByRole("button", { name: "Groceries" })).toBeTruthy();
  });
});
