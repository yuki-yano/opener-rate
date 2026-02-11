import { createStore } from "jotai";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  CalculateInput,
  CalculateOutput,
} from "../../../../shared/apiSchemas";
import { openerRateApi } from "../../api/opener-rate-api";
import {
  calculateInputAtom,
  isShortUrlGenerationLockedAtom,
} from "../derived/atoms";
import { runCalculateAtom, seedSharedUrlAsGeneratedAtom } from "./atoms";
import {
  calculationResultAtom,
  previousCalculationResultAtom,
  savedInputAtom,
  shortUrlCacheAtom,
  shortUrlInputAtom,
  shortUrlLockedUntilChangeAtom,
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
