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

/** Click a sidebar item (the Overview also has tiles with the same names). */
async function goTo(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  const side = await screen.findByRole("complementary");
  await user.click(within(side).getByRole("button", { name }));
}
const openNotes = (user: ReturnType<typeof userEvent.setup>) => goTo(user, /^Notes/);

describe("Notes screen (against the in-memory shell)", () => {
  it("opens on the Overview with Today first", async () => {
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Overview" })).toBeTruthy();
    expect(await screen.findByRole("region", { name: "Today" })).toBeTruthy();
    expect(within(await screen.findByRole("region", { name: "Pinned" })).getByRole("button", { name: "Loaf v1 scope" })).toBeTruthy();
  });

  it("Notes shows Today first, then Pinned apart from the rest", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openNotes(user);
    const regions = (await screen.findAllByRole("region")).map((r) => r.getAttribute("aria-label"));
    expect(regions.indexOf("Today")).toBeLessThan(regions.indexOf("Pinned"));
    expect(regions.indexOf("Pinned")).toBeLessThan(regions.indexOf("All notes"));
    expect(within(screen.getByRole("region", { name: "All notes" })).getByRole("button", { name: "Groceries" })).toBeTruthy();
  });

  it("the Time page shows a daily log for the selected day", async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, /^Time/);
    expect(await screen.findByRole("tablist", { name: "Days" })).toBeTruthy();
    expect(await screen.findByText(/tasks completed/i)).toBeTruthy();
  });

  it("unpinning moves a note out of Pinned", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openNotes(user);
    const card = await screen.findByRole("button", { name: "Shortcuts I want" });
    await user.click(within(card).getByRole("button", { name: "Unpin" }));
    await waitFor(() => {
      const pinned = screen.getByRole("region", { name: "Pinned" });
      expect(within(pinned).queryByRole("button", { name: "Shortcuts I want" })).toBeNull();
    });
  });

  it("deleting a note offers Undo, and Undo brings it back", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openNotes(user);
    const card = await screen.findByRole("button", { name: "Groceries" });
    await user.click(within(card).getByRole("button", { name: "Delete" }));
    await user.click(await screen.findByRole("button", { name: "Undo" }));
    expect(await screen.findByRole("button", { name: "Groceries" })).toBeTruthy();
  });

  it("searches notes by text", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openNotes(user);
    await screen.findByRole("button", { name: "Groceries" });
    await user.type(screen.getByRole("textbox", { name: "Search notes" }), "peanut");
    expect(await screen.findByRole("heading", { name: /Results for/ })).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Friday prep" })).toBeNull());
    expect(screen.getByRole("button", { name: "Groceries" })).toBeTruthy();
  });

  it("restores a note from the Bin page", async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, /^Bin/);
    expect(await screen.findByText(/Old grocery list/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Restore “Old grocery list”/ }));
    await openNotes(user);
    expect(await screen.findByRole("button", { name: "Old grocery list" })).toBeTruthy();
  });

  it("adds a reminder", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Review the sync PR");
    await user.click(screen.getByRole("button", { name: "Add reminder" }));
    await user.type(await screen.findByLabelText("Remind me to"), "Water the plants");
    await user.click(screen.getByRole("button", { name: "Set reminder" }));
    expect(await screen.findByText("Water the plants")).toBeTruthy();
  });
});
