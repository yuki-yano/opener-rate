import { describe, expect, it } from "vitest";

import { calculateOpenerRateDomain } from "./calculate";

describe("calculateOpenerRateDomain", () => {
  it("computes exact probability for required condition", () => {
    const result = calculateOpenerRateDomain({
      deck: { cardCount: 40, firstHand: 5 },
      cards: [{ uid: "a", name: "A", count: 3, memo: "" }],
      patterns: [
        {
          uid: "p-required-a",
          name: "Require A",
          active: true,
          conditions: [
            {
              mode: "required",
              count: 1,
              uids: ["a"],
            },
          ],
          labels: [],
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
        mode: "exact",
        simulationTrials: 10000,
      },
    });

    expect(result.mode).toBe("exact");
    expect(result.overallProbability).toBe("33.75");
    expect(result.patternSuccessRates).toEqual([
      { uid: "p-required-a", rate: "33.75" },
    ]);
  });

  it("supports draw_total with cap1/raw rules", () => {
    const result = calculateOpenerRateDomain({
      deck: { cardCount: 4, firstHand: 2 },
      cards: [
        { uid: "a", name: "A", count: 1, memo: "" },
        { uid: "b", name: "B", count: 1, memo: "" },
      ],
      patterns: [
        {
          uid: "p-draw-total",
          name: "Draw A and B",
          active: true,
          conditions: [
            {
              mode: "draw_total",
              operator: "gte",
              threshold: 2,
              rules: [
                { uids: ["a"], mode: "cap1" },
                { uids: ["b"], mode: "raw" },
              ],
            },
          ],
          labels: [],
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
        mode: "exact",
        simulationTrials: 10000,
      },
    });

    expect(result.overallProbability).toBe("16.66");
    expect(result.patternSuccessRates).toEqual([
      { uid: "p-draw-total", rate: "16.66" },
    ]);
  });

  it("promotes label by sub pattern when trigger is satisfied", () => {
    const result = calculateOpenerRateDomain({
      deck: { cardCount: 4, firstHand: 2 },
      cards: [
        { uid: "starter", name: "初動", count: 1, memo: "" },
        { uid: "grave", name: "墓穴", count: 1, memo: "" },
      ],
      patterns: [
        {
          uid: "p-base",
          name: "基礎",
          active: true,
          conditions: [
            {
              mode: "required",
              count: 1,
              uids: ["starter"],
            },
          ],
          labels: [],
          memo: "",
        },
      ],
      subPatterns: [
        {
          uid: "sp-with-grave",
          name: "with墓穴",
          active: true,
          basePatternUids: ["p-base"],
          triggerConditions: [
            {
              mode: "required",
              count: 1,
              uids: ["grave"],
            },
          ],
          triggerSourceUids: ["grave"],
          applyLimit: "once_per_trial",
          effects: [{ type: "add_label", labelUids: ["l-penetrate"] }],
          memo: "",
        },
      ],
      labels: [{ uid: "l-penetrate", name: "うらら貫通", memo: "" }],
      pot: {
        desiresOrExtravagance: { count: 0 },
        prosperity: { count: 0, cost: 6 },
      },
      settings: {
        mode: "exact",
        simulationTrials: 10000,
      },
    });

    expect(result.mode).toBe("exact");
    expect(result.overallProbability).toBe("50.00");
    expect(result.patternSuccessRates).toEqual([
      { uid: "p-base", rate: "50.00" },
    ]);
    expect(result.labelSuccessRates).toEqual([
      { uid: "l-penetrate", rate: "16.66" },
    ]);
  });
});
