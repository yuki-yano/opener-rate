import { createStore } from "jotai";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CalculateOutput } from "../../../../../shared/apiSchemas";
import { openerRateApi } from "../../api/opener-rate-api";
import { ApiClientError } from "../../api/errors";
import { isShortUrlGenerationLockedAtom } from "../derived/atoms";
import { deckNameAtom, modeAtom } from "../input/atoms";
import {
  hydrateShortUrlLockAtom,
  runCalculateAtom,
  runCreateShortUrlAtom,
  runShareCurrentUrlAtom,
  setModeAndRunCalculateAtom,
  seedSharedUrlAsGeneratedAtom,
} from "./atoms";
import {
  calculationResultAtom,
  previousCalculationResultAtom,
  shortUrlCacheAtom,
  shortUrlErrorAtom,
  shortUrlInputAtom,
  shortUrlLockedSourceHrefAtom,
  shortUrlLockedUntilChangeAtom,
  shortUrlLoadingAtom,
  shortUrlResultAtom,
} from "../ui/atoms";

type MockSessionStorage = {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
};

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
  sessionStorage: MockSessionStorage;
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
  const storage = new Map<string, string>();
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

  const sessionStorage: MockSessionStorage = {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      storage.delete(key);
    }),
  };

  return {
    location,
    history,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    sessionStorage,
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

describe("setModeAndRunCalculateAtom", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("updates mode and runs calculation when mode changes", async () => {
    const store = createStore();
    const calculateSpy = vi
      .spyOn(openerRateApi, "calculate")
      .mockResolvedValue(createOutput("44.44", "simulation"));

    await store.set(setModeAndRunCalculateAtom, "simulation");

    expect(store.get(modeAtom)).toBe("simulation");
    expect(calculateSpy).toHaveBeenCalledTimes(1);
    expect(calculateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({ mode: "simulation" }),
      }),
    );
  });

  it("does not run calculation when mode is unchanged", async () => {
    const store = createStore();
    const calculateSpy = vi.spyOn(openerRateApi, "calculate");

    await store.set(setModeAndRunCalculateAtom, "exact");

    expect(store.get(modeAtom)).toBe("exact");
    expect(calculateSpy).not.toHaveBeenCalled();
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
    expect(store.get(shortUrlLockedSourceHrefAtom)).toBe(
      "https://example.com/#deck=abc",
    );
    expect(store.get(isShortUrlGenerationLockedAtom)).toBe(true);
    expect(mockWindow.sessionStorage.setItem).toHaveBeenCalled();
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

describe("hydrateShortUrlLockAtom", () => {
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

  it("restores lock state when persisted href matches current href", () => {
    const mockWindow = createMockWindow("https://example.com/#deck=abc");
    mockWindow.sessionStorage.setItem(
      "openerRate.shortUrlLockState",
      JSON.stringify({
        sourceHref: "https://example.com/#deck=abc",
        sharedShortUrl: "https://example.com/short_url/abc123de",
      }),
    );
    setGlobalWindow(mockWindow);

    const store = createStore();
    store.set(hydrateShortUrlLockAtom);

    expect(store.get(shortUrlInputAtom)).toBe(
      "https://example.com/short_url/abc123de",
    );
    expect(store.get(shortUrlResultAtom)).toBe(
      "https://example.com/short_url/abc123de",
    );
    expect(store.get(shortUrlLockedUntilChangeAtom)).toBe(true);
    expect(store.get(shortUrlLockedSourceHrefAtom)).toBe(
      "https://example.com/#deck=abc",
    );
    expect(store.get(isShortUrlGenerationLockedAtom)).toBe(true);
  });

  it("drops persisted lock when href does not match", () => {
    const mockWindow = createMockWindow("https://example.com/#deck=other");
    mockWindow.sessionStorage.setItem(
      "openerRate.shortUrlLockState",
      JSON.stringify({
        sourceHref: "https://example.com/#deck=abc",
        sharedShortUrl: "https://example.com/short_url/abc123de",
      }),
    );
    setGlobalWindow(mockWindow);

    const store = createStore();
    store.set(hydrateShortUrlLockAtom);

    expect(store.get(shortUrlLockedUntilChangeAtom)).toBe(false);
    expect(store.get(shortUrlLockedSourceHrefAtom)).toBeNull();
    expect(store.get(isShortUrlGenerationLockedAtom)).toBe(false);
    expect(
      mockWindow.sessionStorage.getItem("openerRate.shortUrlLockState"),
    ).toBeNull();
  });

  it("restores lock when difference is only mode=ai query", () => {
    const mockWindow = createMockWindow(
      "https://example.com/?mode=ai#deck=abc",
    );
    mockWindow.sessionStorage.setItem(
      "openerRate.shortUrlLockState",
      JSON.stringify({
        sourceHref: "https://example.com/#deck=abc",
        sharedShortUrl: "https://example.com/short_url/abc123de",
      }),
    );
    setGlobalWindow(mockWindow);

    const store = createStore();
    store.set(hydrateShortUrlLockAtom);

    expect(store.get(shortUrlLockedUntilChangeAtom)).toBe(true);
    expect(store.get(shortUrlLockedSourceHrefAtom)).toBe(
      "https://example.com/#deck=abc",
    );
    expect(store.get(isShortUrlGenerationLockedAtom)).toBe(true);
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

describe("runShareCurrentUrlAtom", () => {
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

  it("locks as shared after create succeeds", async () => {
    const mockWindow = createMockWindow("https://example.com/#deck=abc");
    setGlobalWindow(mockWindow);
    const store = createStore();

    vi.spyOn(openerRateApi, "createShortUrl").mockResolvedValue({
      shortenUrl: "https://example.com/short_url/abc123de",
    });

    await store.set(runShareCurrentUrlAtom);

    expect(store.get(shortUrlInputAtom)).toBe(
      "https://example.com/short_url/abc123de",
    );
    expect(store.get(shortUrlResultAtom)).toBe(
      "https://example.com/short_url/abc123de",
    );
    expect(store.get(shortUrlLockedUntilChangeAtom)).toBe(true);
    expect(store.get(shortUrlLockedSourceHrefAtom)).toBe(
      "https://example.com/#deck=abc",
    );
    expect(store.get(isShortUrlGenerationLockedAtom)).toBe(true);
  });

  it("creates short url without mode=ai when current url includes mode=ai", async () => {
    const mockWindow = createMockWindow(
      "https://example.com/?mode=ai#deck=abc",
    );
    setGlobalWindow(mockWindow);
    const store = createStore();
    const createShortUrlSpy = vi
      .spyOn(openerRateApi, "createShortUrl")
      .mockResolvedValue({
        shortenUrl: "https://example.com/short_url/abc123de",
      });

    await store.set(runShareCurrentUrlAtom);

    expect(createShortUrlSpy).toHaveBeenCalledWith(
      "https://example.com/#deck=abc",
    );
    expect(store.get(shortUrlLockedSourceHrefAtom)).toBe(
      "https://example.com/#deck=abc",
    );
    expect(store.get(isShortUrlGenerationLockedAtom)).toBe(true);
  });

  it("locks as shared when cached short URL exists", async () => {
    const mockWindow = createMockWindow("https://example.com/#deck=abc");
    setGlobalWindow(mockWindow);
    const store = createStore();
    store.set(shortUrlCacheAtom, {
      "https://example.com/#deck=abc":
        "https://example.com/short_url/cached123",
    });

    await store.set(runShareCurrentUrlAtom);

    expect(store.get(shortUrlInputAtom)).toBe(
      "https://example.com/short_url/cached123",
    );
    expect(store.get(shortUrlResultAtom)).toBe(
      "https://example.com/short_url/cached123",
    );
    expect(store.get(shortUrlLockedUntilChangeAtom)).toBe(true);
    expect(store.get(shortUrlLockedSourceHrefAtom)).toBe(
      "https://example.com/#deck=abc",
    );
    expect(store.get(isShortUrlGenerationLockedAtom)).toBe(true);
  });

  it("uses cache keyed by url without mode=ai", async () => {
    const mockWindow = createMockWindow(
      "https://example.com/?mode=ai#deck=abc",
    );
    setGlobalWindow(mockWindow);
    const store = createStore();
    store.set(shortUrlCacheAtom, {
      "https://example.com/#deck=abc":
        "https://example.com/short_url/cached123",
    });
    const createShortUrlSpy = vi.spyOn(openerRateApi, "createShortUrl");

    await store.set(runShareCurrentUrlAtom);

    expect(createShortUrlSpy).not.toHaveBeenCalled();
    expect(store.get(shortUrlInputAtom)).toBe(
      "https://example.com/short_url/cached123",
    );
    expect(store.get(shortUrlLockedSourceHrefAtom)).toBe(
      "https://example.com/#deck=abc",
    );
    expect(store.get(isShortUrlGenerationLockedAtom)).toBe(true);
  });
});
