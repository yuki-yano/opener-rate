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

const createSequenceRng = (values: number[]) => {
  let index = 0;
  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
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
    expect(alwaysOne.vsPenetrationCombinations).toEqual([
      {
        combinationKey: "cat-1:1",
        combinationLabel: "妨害",
        successCount: 0,
        occurrenceCount: 20,
        occurrenceRate: "100.00",
        successRate: "0.00",
        isPenetrationImpossible: true,
      },
    ]);
  });

  it("reports occurrence rate and in-occurrence success rate per combination", () => {
    const baseInput: CalculateInput = {
      deck: { cardCount: 2, firstHand: 1 },
      cards: [
        { uid: "starter", name: "初動", count: 1, memo: "" },
        { uid: "other", name: "その他", count: 1, memo: "" },
      ],
      patterns: [
        {
          uid: "p-base",
          name: "初動成立",
          active: true,
          conditions: [{ mode: "required", count: 1, uids: ["starter"] }],
          labels: [],
          effects: [
            {
              type: "add_penetration",
              disruptionCategoryUids: ["cat-1"],
              amount: 1,
            },
          ],
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
        simulationTrials: 2,
      },
      vs: {
        enabled: true,
        opponentDeckSize: 1,
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
    const result = calculateBySimulation({
      ...prepared,
      trials: 2,
      rng: createSequenceRng([0.999999, 0]),
    });

    expect(result.vsBreakdown).toEqual({
      noDisruptionSuccessRate: "0.00",
      disruptedButPenetratedRate: "50.00",
      disruptedAndFailedRate: "50.00",
    });
    expect(result.vsPenetrationCombinations).toEqual([
      {
        combinationKey: "cat-1:1",
        combinationLabel: "妨害",
        successCount: 1,
        occurrenceCount: 2,
        occurrenceRate: "100.00",
        successRate: "50.00",
        penetrableHandCombinations: [
          {
            handKey: "starter:1",
            handLabel: "初動",
            successCount: 1,
            successRateInCombination: "50.00",
          },
        ],
        isPenetrationImpossible: false,
      },
    ]);
  });

  it("separates combination counts by card even when sharing disruption category", () => {
    const baseInput: CalculateInput = {
      deck: { cardCount: 1, firstHand: 1 },
      cards: [{ uid: "starter", name: "初動", count: 1, memo: "" }],
      patterns: [
        {
          uid: "p-base",
          name: "初動成立",
          active: true,
          conditions: [{ mode: "required", count: 1, uids: ["starter"] }],
          labels: [],
          effects: [
            {
              type: "add_penetration",
              disruptionCategoryUids: ["cat-negate"],
              amount: 2,
            },
          ],
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
        simulationTrials: 1,
      },
      vs: {
        enabled: true,
        opponentDeckSize: 2,
        opponentHandSize: 2,
        opponentDisruptions: [
          {
            uid: "od-imperm",
            disruptionCardUid: "dc-imperm",
            name: "無限泡影",
            count: 1,
            oncePerName: true,
            disruptionCategoryUid: "cat-negate",
          },
          {
            uid: "od-ash",
            disruptionCardUid: "dc-ash",
            name: "灰流うらら",
            count: 1,
            oncePerName: true,
            disruptionCategoryUid: "cat-negate",
          },
        ],
      },
    };

    const prepared = prepareSimulation(baseInput);
    const result = calculateBySimulation({
      ...prepared,
      trials: 1,
      rng: () => 0,
    });

    expect(result.vsBreakdown).toEqual({
      noDisruptionSuccessRate: "0.00",
      disruptedButPenetratedRate: "100.00",
      disruptedAndFailedRate: "0.00",
    });
    expect(result.vsPenetrationCombinations).toEqual([
      {
        combinationKey: "dc-ash:1|dc-imperm:1",
        combinationLabel: "灰流うらら + 無限泡影",
        successCount: 1,
        occurrenceCount: 1,
        occurrenceRate: "100.00",
        successRate: "100.00",
        penetrableHandCombinations: [
          {
            handKey: "starter:1",
            handLabel: "初動",
            successCount: 1,
            successRateInCombination: "100.00",
          },
        ],
        isPenetrationImpossible: false,
      },
    ]);
  });

  it("includes sub-pattern trigger cards in penetrable hand summary", () => {
    const baseInput: CalculateInput = {
      deck: { cardCount: 2, firstHand: 2 },
      cards: [
        { uid: "starter", name: "初動", count: 1, memo: "" },
        { uid: "grave", name: "墓穴", count: 1, memo: "" },
      ],
      patterns: [
        {
          uid: "p-base",
          name: "初動成立",
          active: true,
          conditions: [{ mode: "required", count: 1, uids: ["starter"] }],
          labels: [],
          effects: [],
          memo: "",
        },
      ],
      subPatterns: [
        {
          uid: "sp-penetrate",
          name: "墓穴貫通",
          active: true,
          basePatternUids: ["p-base"],
          triggerConditions: [{ mode: "required", count: 1, uids: ["grave"] }],
          triggerSourceUids: ["grave"],
          applyLimit: "once_per_trial",
          effects: [
            {
              type: "add_penetration",
              disruptionCategoryUids: ["cat-1"],
              amount: 1,
            },
          ],
          memo: "",
        },
      ],
      labels: [],
      pot: {
        desiresOrExtravagance: { count: 0 },
        prosperity: { count: 0, cost: 6 },
      },
      settings: {
        mode: "simulation",
        simulationTrials: 1,
      },
      vs: {
        enabled: true,
        opponentDeckSize: 1,
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
    const result = calculateBySimulation({
      ...prepared,
      trials: 1,
      rng: () => 0,
    });

    expect(result.vsPenetrationCombinations).toEqual([
      {
        combinationKey: "cat-1:1",
        combinationLabel: "妨害",
        successCount: 1,
        occurrenceCount: 1,
        occurrenceRate: "100.00",
        successRate: "100.00",
        penetrableHandCombinations: [
          {
            handKey: "grave:1|starter:1",
            handLabel: "墓穴 + 初動",
            successCount: 1,
            successRateInCombination: "100.00",
          },
        ],
        isPenetrationImpossible: false,
      },
    ]);
  });

  it("omits cards unrelated to penetration from hand combination summary", () => {
    const baseInput: CalculateInput = {
      deck: { cardCount: 2, firstHand: 2 },
      cards: [
        { uid: "starter", name: "初動", count: 1, memo: "" },
        { uid: "brick", name: "関係ない札", count: 1, memo: "" },
      ],
      patterns: [
        {
          uid: "p-base",
          name: "初動成立",
          active: true,
          conditions: [{ mode: "required", count: 1, uids: ["starter"] }],
          labels: [],
          effects: [
            {
              type: "add_penetration",
              disruptionCategoryUids: ["cat-1"],
              amount: 1,
            },
          ],
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
        simulationTrials: 1,
      },
      vs: {
        enabled: true,
        opponentDeckSize: 1,
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
    const result = calculateBySimulation({
      ...prepared,
      trials: 1,
      rng: () => 0,
    });

    expect(result.vsPenetrationCombinations).toEqual([
      {
        combinationKey: "cat-1:1",
        combinationLabel: "妨害",
        successCount: 1,
        occurrenceCount: 1,
        occurrenceRate: "100.00",
        successRate: "100.00",
        penetrableHandCombinations: [
          {
            handKey: "starter:1",
            handLabel: "初動",
            successCount: 1,
            successRateInCombination: "100.00",
          },
        ],
        isPenetrationImpossible: false,
      },
    ]);
  });
});
