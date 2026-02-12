import { createStore } from "jotai";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  CalculateInput,
  CalculateOutput,
} from "../../../../../shared/apiSchemas";
import { openerRateApi } from "../../api/opener-rate-api";
import { ApiClientError } from "../../api/errors";
import {
  calculateInputAtom,
  isShortUrlGenerationLockedAtom,
} from "../derived/atoms";
import {
  runCalculateAtom,
  runCreateShortUrlAtom,
  seedSharedUrlAsGeneratedAtom,
} from "./atoms";
import {
  calculationResultAtom,
  previousCalculationResultAtom,
  savedInputAtom,
  shortUrlCacheAtom,
  shortUrlErrorAtom,
  shortUrlInputAtom,
  shortUrlLockedUntilChangeAtom,
  shortUrlLoadingAtom,
  shortUrlResultAtom,
} from "../ui/atoms";

const defaultVsInput: CalculateInput["vs"] = {
  enabled: false,
  opponentDeckSize: 40,
  opponentHandSize: 5,
  opponentDisruptions: [],
};

const differentSavedInput: CalculateInput = {
  deck: { cardCount: 39, firstHand: 5 },
  cards: [],
  patterns: [],
  subPatterns: [],
  labels: [],
  pot: {
    desiresOrExtravagance: { count: 0 },
    prosperity: { count: 0, cost: 6 },
  },
  vs: defaultVsInput,
  settings: {
    mode: "exact",
    simulationTrials: 100000,
  },
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
  afterEach(() => {
    vi.restoreAllMocks();
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
  it("does not update short URL form when seeded URL is not a short URL", () => {
    const store = createStore();
    const sharedUrl = "https://example.com/#deck=abc";

    store.set(seedSharedUrlAsGeneratedAtom, sharedUrl);

    expect(store.get(shortUrlInputAtom)).toBe("");
    expect(store.get(shortUrlResultAtom)).toBeNull();
    expect(store.get(shortUrlCacheAtom)[sharedUrl]).toBeUndefined();
    expect(store.get(shortUrlLockedUntilChangeAtom)).toBe(false);
    expect(store.get(isShortUrlGenerationLockedAtom)).toBe(false);

    store.set(savedInputAtom, differentSavedInput);

    expect(store.get(calculateInputAtom).deck.cardCount).toBe(40);
    expect(store.get(isShortUrlGenerationLockedAtom)).toBe(false);
  });

  it("locks regeneration when seeded URL is a short URL", () => {
    const store = createStore();
    const sharedUrl = "https://example.com/short_url/abc123de";

    store.set(seedSharedUrlAsGeneratedAtom, sharedUrl);

    expect(store.get(shortUrlInputAtom)).toBe(sharedUrl);
    expect(store.get(shortUrlResultAtom)).toBe(sharedUrl);
    expect(store.get(shortUrlCacheAtom)[sharedUrl]).toBe(sharedUrl);
    expect(store.get(shortUrlLockedUntilChangeAtom)).toBe(true);
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
