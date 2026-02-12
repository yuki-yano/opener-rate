import { describe, expect, it } from "vitest";

import type { CalculateInput } from "../../../shared/apiSchemas";
import { calculateBySimulation } from "./calculate-simulation";
import { compilePatterns } from "./compile-conditions";
import { compileSubPatterns } from "./compile-sub-patterns";
import { normalizeCalculateInput } from "./normalize";

const prepareSimulation = (input: CalculateInput) => {
  const normalized = normalizeCalculateInput(input);
  if (!normalized.ok) {
    throw new Error("normalized input should be valid");
  }

  return {
    normalized: normalized.value,
    compiledPatterns: compilePatterns(normalized.value),
    compiledSubPatterns: compileSubPatterns(normalized.value),
  };
};

describe("calculateBySimulation (rng)", () => {
  it("uses injected rng for deterministic shuffle result", () => {
    const baseInput: CalculateInput = {
      deck: { cardCount: 2, firstHand: 1 },
      cards: [
        { uid: "a", name: "A", count: 1, memo: "" },
        { uid: "b", name: "B", count: 1, memo: "" },
      ],
      patterns: [
        {
          uid: "p1",
          name: "Aを引く",
          active: true,
          conditions: [{ mode: "required", count: 1, uids: ["a"] }],
          labels: [],
          effects: [],
          memo: "",
        },
      ],
      subPatterns: [],
      labels: [],
      pot: {
        desiresOrExtravagance: { count: 0 },
        prosperity: { count: 0, cost: 6 },
      },
      settings: {
        mode: "simulation",
        simulationTrials: 20,
      },
    };

    const prepared = prepareSimulation(baseInput);
    const alwaysZero = calculateBySimulation({
      ...prepared,
      trials: 20,
      rng: () => 0,
    });
    const alwaysOne = calculateBySimulation({
      ...prepared,
      trials: 20,
      rng: () => 0.999999,
    });

    expect(alwaysZero.overallProbability).toBe("0.00");
    expect(alwaysOne.overallProbability).toBe("100.00");
  });

  it("uses injected rng for opponent disruption draw order", () => {
    const baseInput: CalculateInput = {
      deck: { cardCount: 1, firstHand: 1 },
      cards: [{ uid: "a", name: "A", count: 1, memo: "" }],
      patterns: [
        {
          uid: "p1",
          name: "常時成功",
          active: true,
          conditions: [],
          labels: [],
          effects: [],
          memo: "",
        },
      ],
      subPatterns: [],
      labels: [],
      pot: {
        desiresOrExtravagance: { count: 0 },
        prosperity: { count: 0, cost: 6 },
      },
      settings: {
        mode: "simulation",
        simulationTrials: 20,
      },
      vs: {
        enabled: true,
        opponentDeckSize: 2,
        opponentHandSize: 1,
        opponentDisruptions: [
          {
            uid: "od-1",
            name: "妨害",
            count: 1,
            oncePerName: true,
            disruptionCategoryUid: "cat-1",
          },
        ],
      },
    };

    const prepared = prepareSimulation(baseInput);
    const alwaysZero = calculateBySimulation({
      ...prepared,
      trials: 20,
      rng: () => 0,
    });
    const alwaysOne = calculateBySimulation({
      ...prepared,
      trials: 20,
      rng: () => 0.999999,
    });

    expect(alwaysZero.vsBreakdown).toEqual({
      noDisruptionSuccessRate: "100.00",
      disruptedButPenetratedRate: "0.00",
      disruptedAndFailedRate: "0.00",
    });
    expect(alwaysOne.vsBreakdown).toEqual({
      noDisruptionSuccessRate: "0.00",
      disruptedButPenetratedRate: "0.00",
      disruptedAndFailedRate: "100.00",
    });
  });
});
