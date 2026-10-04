import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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

// A fresh in-memory shell (and so fresh preferences) for every test.
let App: typeof import("./App").App;
beforeEach(async () => {
  vi.resetModules();
  ({ App } = await import("./App"));
});

/** Click a sidebar item (the Overview also has tiles with the same names). */
async function goTo(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  const side = await screen.findByRole("complementary");
  await user.click(within(side).getByRole("button", { name }));
}
const openNotes = (user: ReturnType<typeof userEvent.setup>) => goTo(user, /^Notes/);

describe("Notes screen (against the in-memory shell)", () => {
  it("opens on Today overview: agenda, progress, time and activity, without search or New note", async () => {
    render(<App />);
    expect(await screen.findByRole("region", { name: "Today’s agenda" })).toBeTruthy();
    for (const name of ["Progress", "Done this week", "Where your time went", "Activity"]) {
      expect(await screen.findByRole("region", { name })).toBeTruthy();
    }
    expect(screen.queryByRole("textbox", { name: "Search notes" })).toBeNull();
    expect(screen.queryByRole("button", { name: /New note/ })).toBeNull();
  });

  it("the Time card shows each app, expands a browser into sites, and opens the active spans", async () => {
    const user = userEvent.setup();
    render(<App />);
    const card = await screen.findByRole("region", { name: "Where your time went" });
    await user.click(await within(card).findByRole("button", { name: /Show sites in Google Chrome/ }));
    expect(await within(card).findByRole("button", { name: /^github\.com/ })).toBeTruthy();
    await user.click(within(card).getByRole("button", { name: /^VS Code,/ }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText(/Active from/)).toBeTruthy();
  });

  it("pasted links become shortcuts", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Add link" }));
    await user.type(await screen.findByLabelText("Paste links"), "linear.app/team");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("button", { name: "Open linear.app" })).toBeTruthy();
  });

  it("Notes has search and New note, shows Today first, then the week, Pinned, and the rest", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openNotes(user);
    expect(await screen.findByRole("textbox", { name: "Search notes" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /New note/ })).toBeTruthy();
    const regions = (await screen.findAllByRole("region")).map((r) => r.getAttribute("aria-label"));
    const order = ["Today", "This week", "Pinned", "All notes"].map((n) => regions.indexOf(n));
    expect(order.every((n) => n >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(within(screen.getByRole("region", { name: "All notes" })).getByRole("button", { name: "Groceries" })).toBeTruthy();
  });

  it("the Time page filters by period and category", async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, /^Time/);
    const filters = await screen.findByRole("group", { name: "Filters" });
    expect(within(filters).getByRole("radio", { name: "30 days" })).toBeTruthy();
    expect(screen.queryByRole("tablist", { name: "Days" })).toBeNull();
    await user.click(within(filters).getByRole("radio", { name: "7 days" }));
    expect(await screen.findByRole("region", { name: "Apps" })).toBeTruthy();
    await user.click(within(filters).getByRole("radio", { name: "Sites" }));
    expect(await screen.findByRole("region", { name: "Sites" })).toBeTruthy();
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
