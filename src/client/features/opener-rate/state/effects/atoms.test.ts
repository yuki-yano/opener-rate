import { createStore } from "jotai";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CalculateOutput } from "../../../../../shared/apiSchemas";
import { openerRateApi } from "../../api/opener-rate-api";
import { ApiClientError } from "../../api/errors";
import { isShortUrlGenerationLockedAtom } from "../derived/atoms";
import { deckNameAtom } from "../input/atoms";
import {
  runCalculateAtom,
  runCreateShortUrlAtom,
  seedSharedUrlAsGeneratedAtom,
} from "./atoms";
import {
  calculationResultAtom,
  previousCalculationResultAtom,
  shortUrlCacheAtom,
  shortUrlErrorAtom,
  shortUrlInputAtom,
  shortUrlLockedUntilChangeAtom,
  shortUrlLoadingAtom,
  shortUrlResultAtom,
} from "../ui/atoms";

type MockWindow = {
  location: {
    pathname: string;
    search: string;
    hash: string;
    href: string;
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
  location.href = parsed.toString();
};

const createMockWindow = (initialUrl = "https://example.com/"): MockWindow => {
  const parsed = new URL(initialUrl);
  const location: MockWindow["location"] = {
    pathname: parsed.pathname,
    search: parsed.search,
    hash: parsed.hash,
    href: parsed.toString(),
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

const createOutput = (
  overallProbability: string,
  mode: CalculateOutput["mode"] = "exact",
): CalculateOutput => ({
  overallProbability,
  patternSuccessRates: [],
  labelSuccessRates: [],
  mode,
});

describe("runCalculateAtom", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalWindow == null) {
      delete (globalThis as { window?: Window }).window;
      return;
    }
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
      writable: true,
    });
  });

  it("keeps the previous exact result for diff display", async () => {
    const store = createStore();
    const currentResult = createOutput("10.00", "exact");
    const nextResult = createOutput("20.00", "exact");
    store.set(calculationResultAtom, currentResult);
    vi.spyOn(openerRateApi, "calculate").mockResolvedValue(nextResult);

    await store.set(runCalculateAtom);

    expect(store.get(calculationResultAtom)).toEqual(nextResult);
    expect(store.get(previousCalculationResultAtom)).toEqual(currentResult);
  });
});

describe("seedSharedUrlAsGeneratedAtom", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalWindow == null) {
      delete (globalThis as { window?: Window }).window;
      return;
    }
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
      writable: true,
    });
  });

  it("does not update short URL form when seeded URL is not a short URL", () => {
    const mockWindow = createMockWindow();
    setGlobalWindow(mockWindow);

    const store = createStore();
    const sharedUrl = "https://example.com/#deck=abc";

    store.set(seedSharedUrlAsGeneratedAtom, sharedUrl);

    expect(store.get(shortUrlInputAtom)).toBe("");
    expect(store.get(shortUrlResultAtom)).toBeNull();
    expect(store.get(shortUrlCacheAtom)[sharedUrl]).toBeUndefined();
    expect(store.get(shortUrlLockedUntilChangeAtom)).toBe(false);
    expect(store.get(isShortUrlGenerationLockedAtom)).toBe(false);
  });

  it("locks regeneration when seeded URL is a short URL", () => {
    const mockWindow = createMockWindow("https://example.com/#deck=abc");
    setGlobalWindow(mockWindow);

    const store = createStore();
    const sharedUrl = "https://example.com/short_url/abc123de";

    store.set(seedSharedUrlAsGeneratedAtom, sharedUrl);

    expect(store.get(shortUrlInputAtom)).toBe(sharedUrl);
    expect(store.get(shortUrlResultAtom)).toBe(sharedUrl);
    expect(store.get(shortUrlCacheAtom)[sharedUrl]).toBe(sharedUrl);
    expect(store.get(shortUrlLockedUntilChangeAtom)).toBe(true);
    expect(store.get(isShortUrlGenerationLockedAtom)).toBe(true);
  });

  it("unlocks regeneration when href changes after seed", () => {
    const mockWindow = createMockWindow("https://example.com/#deck=abc");
    setGlobalWindow(mockWindow);

    const store = createStore();
    const sharedUrl = "https://example.com/short_url/abc123de";
    store.set(seedSharedUrlAsGeneratedAtom, sharedUrl);
    expect(store.get(isShortUrlGenerationLockedAtom)).toBe(true);

    store.set(deckNameAtom, "Blue-Eyes");

    expect(mockWindow.location.href).toContain("#");
    expect(store.get(isShortUrlGenerationLockedAtom)).toBe(false);
  });
});

describe("runCreateShortUrlAtom", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps network_error to a friendly message", async () => {
    const store = createStore();
    vi.spyOn(openerRateApi, "createShortUrl").mockRejectedValue(
      new ApiClientError({
        code: "network_error",
        message: "通信エラーが発生しました",
      }),
    );

    await store.set(runCreateShortUrlAtom, "https://example.com");

    expect(store.get(shortUrlErrorAtom)).toBe(
      "通信エラーが発生しました。接続状況を確認してください",
    );
    expect(store.get(shortUrlLoadingAtom)).toBe(false);
  });

  it("keeps server message for http_error", async () => {
    const store = createStore();
    vi.spyOn(openerRateApi, "createShortUrl").mockRejectedValue(
      new ApiClientError({
        code: "http_error",
        message: "URL origin is not allowed",
        status: 400,
      }),
    );

    await store.set(runCreateShortUrlAtom, "https://example.com");

    expect(store.get(shortUrlErrorAtom)).toBe("URL origin is not allowed");
    expect(store.get(shortUrlLoadingAtom)).toBe(false);
  });
});
