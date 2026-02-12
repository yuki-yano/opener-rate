import { createStore } from "jotai";
import { afterEach, describe, expect, it, vi } from "vitest";

type MockWindow = {
  location: {
    pathname: string;
    search: string;
    hash: string;
  };
  history: {
    state: unknown;
    pushState: ReturnType<typeof vi.fn>;
    replaceState: ReturnType<typeof vi.fn>;
  };
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
};

const updateLocationFromUrl = (
  location: MockWindow["location"],
  url: string | URL | null | undefined,
) => {
  if (url == null) return;
  const parsed = new URL(String(url), "https://example.com");
  location.pathname = parsed.pathname;
  location.search = parsed.search;
  location.hash = parsed.hash;
};

const createMockWindow = (): MockWindow => {
  const location = {
    pathname: "/",
    search: "",
    hash: "",
  };
  const history: MockWindow["history"] = {
    state: null,
    pushState: vi.fn((state: unknown, _unused: string, url?: string | URL) => {
      history.state = state;
      updateLocationFromUrl(location, url);
    }),
    replaceState: vi.fn(
      (state: unknown, _unused: string, url?: string | URL) => {
        history.state = state;
        updateLocationFromUrl(location, url);
      },
    ),
  };

  return {
    location,
    history,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
};

const setGlobalWindow = (mockWindow: MockWindow) => {
  Object.defineProperty(globalThis, "window", {
    value: mockWindow,
    configurable: true,
    writable: true,
  });
};

describe("hash-backed input atoms", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();

    if (originalWindow === undefined) {
      delete (globalThis as { window?: Window }).window;
      return;
    }

    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
      writable: true,
    });
  });

  it("no-op update does not write hash", async () => {
    const mockWindow = createMockWindow();
    setGlobalWindow(mockWindow);

    const { patternsAtom } = await import("./atoms");
    const store = createStore();

    store.set(patternsAtom, (current) => current);

    expect(mockWindow.location.hash).toBe("");
    expect(mockWindow.history.pushState).not.toHaveBeenCalled();
    expect(mockWindow.history.replaceState).not.toHaveBeenCalled();
  });

  it("value update writes hash", async () => {
    const mockWindow = createMockWindow();
    setGlobalWindow(mockWindow);

    const { deckAtom } = await import("./atoms");
    const store = createStore();

    store.set(deckAtom, (current) => ({
      ...current,
      cardCount: current.cardCount + 1,
    }));

    expect(mockWindow.location.hash).toContain("#deck=");
    expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
  });
});
