import { describe, expect, it } from "vitest";

import type { CalculateInput } from "../../shared/apiSchemas";
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

  it("computes vs breakdown with disruption penetration", () => {
    const result = calculateOpenerRateDomain({
      deck: { cardCount: 1, firstHand: 1 },
      cards: [{ uid: "starter", name: "初動", count: 1, memo: "" }],
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
          uid: "sp-penetrate",
          name: "うらら貫通付与",
          active: true,
          basePatternUids: ["p-base"],
          triggerConditions: [
            {
              mode: "required",
              count: 1,
              uids: ["starter"],
            },
          ],
          triggerSourceUids: [],
          applyLimit: "once_per_trial",
          effects: [
            {
              type: "add_penetration",
              disruptionCardUids: ["dc-ash"],
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
        simulationTrials: 1000,
      },
      vs: {
        enabled: true,
        opponentDeckSize: 1,
        opponentHandSize: 1,
        opponentDisruptions: [
          {
            uid: "d-ash",
            disruptionCardUid: "dc-ash",
            name: "灰流うらら",
            count: 1,
            oncePerName: true,
          },
        ],
      },
    });

    expect(result.mode).toBe("simulation");
    expect(result.overallProbability).toBe("100.00");
    expect(result.vsBreakdown).toEqual({
      noDisruptionSuccessRate: "0.00",
      disruptedButPenetratedRate: "100.00",
      disruptedAndFailedRate: "0.00",
    });
  });

  it("applies oncePerName in vs disruption count", () => {
    const baseInput: CalculateInput = {
      deck: { cardCount: 1, firstHand: 1 },
      cards: [{ uid: "starter", name: "初動", count: 1, memo: "" }],
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
          uid: "sp-penetrate",
          name: "うらら貫通付与",
          active: true,
          basePatternUids: ["p-base"],
          triggerConditions: [
            {
              mode: "required",
              count: 1,
              uids: ["starter"],
            },
          ],
          triggerSourceUids: [],
          applyLimit: "once_per_trial" as const,
          effects: [
            {
              type: "add_penetration" as const,
              disruptionCardUids: ["dc-ash"],
              amount: 1,
            },
          ],
          memo: "",
        },
      ],
      labels: [],
      pot: {
        desiresOrExtravagance: { count: 0 },
        prosperity: { count: 0, cost: 6 as const },
      },
      settings: {
        mode: "simulation",
        simulationTrials: 1000,
      },
    };

    const onceLimited = calculateOpenerRateDomain({
      ...baseInput,
      vs: {
        enabled: true,
        opponentDeckSize: 2,
        opponentHandSize: 2,
        opponentDisruptions: [
          {
            uid: "d-ash",
            disruptionCardUid: "dc-ash",
            name: "灰流うらら",
            count: 2,
            oncePerName: true,
          },
        ],
      },
    });

    const noLimit = calculateOpenerRateDomain({
      ...baseInput,
      vs: {
        enabled: true,
        opponentDeckSize: 2,
        opponentHandSize: 2,
        opponentDisruptions: [
          {
            uid: "d-ash",
            disruptionCardUid: "dc-ash",
            name: "灰流うらら",
            count: 2,
            oncePerName: false,
          },
        ],
      },
    });

    expect(onceLimited.overallProbability).toBe("100.00");
    expect(onceLimited.vsBreakdown?.disruptedButPenetratedRate).toBe("100.00");
    expect(noLimit.overallProbability).toBe("0.00");
    expect(noLimit.vsBreakdown?.disruptedAndFailedRate).toBe("100.00");
  });
});
