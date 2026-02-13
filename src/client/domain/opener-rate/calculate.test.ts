import { describe, expect, it, vi } from "vitest";

import { calculateOpenerRateDomain } from "./calculate";
import {
  createCalculateInput,
  createSimulationSettings,
} from "./test-fixtures";

describe("calculateOpenerRateDomain", () => {
  it("excludes flagged patterns from overall probability", () => {
    const result = calculateOpenerRateDomain(
      createCalculateInput({
        deck: { cardCount: 2, firstHand: 1 },
        cards: [
          { uid: "a", name: "A", count: 1, memo: "" },
          { uid: "b", name: "B", count: 1, memo: "" },
        ],
        patterns: [
          {
            uid: "p-excluded",
            name: "除外パターン",
            active: true,
            excludeFromOverall: true,
            conditions: [{ mode: "required", count: 1, uids: ["a"] }],
            labels: [],
            effects: [],
            memo: "",
          },
          {
            uid: "p-counted",
            name: "集計対象パターン",
            active: true,
            excludeFromOverall: false,
            conditions: [{ mode: "required", count: 1, uids: ["b"] }],
            labels: [],
            effects: [],
            memo: "",
          },
        ],
        subPatterns: [],
        labels: [],
      }),
    );

    expect(result.overallProbability).toBe("50.00");
    expect(result.patternSuccessRates).toEqual([
      { uid: "p-excluded", rate: "50.00" },
      { uid: "p-counted", rate: "50.00" },
    ]);
  });

  it("does not count labels from excluded pattern for overall probability", () => {
    const result = calculateOpenerRateDomain(
      createCalculateInput({
        deck: { cardCount: 2, firstHand: 1 },
        cards: [
          { uid: "a", name: "A", count: 1, memo: "" },
          { uid: "b", name: "B", count: 1, memo: "" },
        ],
        patterns: [
          {
            uid: "p-excluded",
            name: "除外パターン",
            active: true,
            excludeFromOverall: true,
            conditions: [{ mode: "required", count: 1, uids: ["a"] }],
            labels: [{ uid: "l-excluded" }],
            effects: [],
            memo: "",
          },
        ],
        subPatterns: [],
        labels: [{ uid: "l-excluded", name: "除外ラベル", memo: "" }],
      }),
    );

    expect(result.overallProbability).toBe("0.00");
    expect(result.patternSuccessRates).toEqual([
      { uid: "p-excluded", rate: "50.00" },
    ]);
    expect(result.labelSuccessRates).toEqual([
      { uid: "l-excluded", rate: "50.00" },
    ]);
  });

  it("does not count sub-pattern effects from excluded base pattern for overall probability", () => {
    const result = calculateOpenerRateDomain(
      createCalculateInput({
        deck: { cardCount: 2, firstHand: 1 },
        cards: [
          { uid: "a", name: "A", count: 1, memo: "" },
          { uid: "b", name: "B", count: 1, memo: "" },
        ],
        patterns: [
          {
            uid: "p-excluded",
            name: "除外パターン",
            active: true,
            excludeFromOverall: true,
            conditions: [{ mode: "required", count: 1, uids: ["a"] }],
            labels: [],
            effects: [],
            memo: "",
          },
        ],
        subPatterns: [
          {
            uid: "sp-from-excluded",
            name: "除外起点サブ",
            active: true,
            basePatternUids: ["p-excluded"],
            triggerConditions: [],
            triggerSourceUids: [],
            applyLimit: "once_per_trial",
            effects: [{ type: "add_label", labelUids: ["l-sub"] }],
            memo: "",
          },
        ],
        labels: [{ uid: "l-sub", name: "サブラベル", memo: "" }],
      }),
    );

    expect(result.overallProbability).toBe("0.00");
    expect(result.patternSuccessRates).toEqual([
      { uid: "p-excluded", rate: "50.00" },
    ]);
    expect(result.labelSuccessRates).toEqual([{ uid: "l-sub", rate: "50.00" }]);
  });

  it("computes exact probability for required condition", () => {
    const result = calculateOpenerRateDomain(
      createCalculateInput({
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
            effects: [],
            memo: "",
          },
        ],
        subPatterns: [],
        labels: [],
      }),
    );

    expect(result.mode).toBe("exact");
    expect(result.overallProbability).toBe("33.75");
    expect(result.patternSuccessRates).toEqual([
      { uid: "p-required-a", rate: "33.75" },
    ]);
  });

  it("returns card_count_exceeded error output when deck size is exceeded", () => {
    const result = calculateOpenerRateDomain(
      createCalculateInput({
        deck: { cardCount: 1, firstHand: 1 },
        cards: [{ uid: "a", name: "A", count: 2, memo: "" }],
        patterns: [
          {
            uid: "p-required-a",
            name: "Require A",
            active: true,
            conditions: [{ mode: "required", count: 1, uids: ["a"] }],
            labels: [],
            effects: [],
            memo: "",
          },
        ],
        subPatterns: [],
        labels: [{ uid: "l1", name: "label1", memo: "" }],
      }),
    );

    expect(result.mode).toBe("exact");
    expect(result.overallProbability).toBe("0.00");
    expect(result.patternSuccessRates).toEqual([
      { uid: "p-required-a", rate: "0.00" },
    ]);
    expect(result.labelSuccessRates).toEqual([{ uid: "l1", rate: "0.00" }]);
    expect(result.error).toEqual({
      type: "card_count_exceeded",
      deckSize: 1,
      totalCards: 2,
      excess: 1,
    });
  });

  it("falls back to simulation mode when exact mode is requested with pot enabled", () => {
    const result = calculateOpenerRateDomain(
      createCalculateInput({
        deck: { cardCount: 1, firstHand: 1 },
        cards: [],
        patterns: [],
        subPatterns: [],
        labels: [],
        pot: {
          desiresOrExtravagance: { count: 0 },
          prosperity: { count: 1, cost: 6 },
        },
        settings: {
          mode: "exact",
          simulationTrials: 1000,
        },
      }),
    );

    expect(result.mode).toBe("simulation");
  });

  it("falls back to simulation mode when exact mode is requested with vs enabled", () => {
    const result = calculateOpenerRateDomain(
      createCalculateInput({
        deck: { cardCount: 1, firstHand: 1 },
        cards: [],
        patterns: [],
        subPatterns: [],
        labels: [],
        pot: {
          desiresOrExtravagance: { count: 0 },
          prosperity: { count: 0, cost: 6 },
        },
        settings: {
          mode: "exact",
          simulationTrials: 1000,
        },
        vs: {
          enabled: true,
          opponentDeckSize: 1,
          opponentHandSize: 1,
          opponentDisruptions: [],
        },
      }),
    );

    expect(result.mode).toBe("simulation");
  });

  it("returns 0.00 rates when simulation trials is zero", () => {
    const result = calculateOpenerRateDomain(
      createCalculateInput({
        deck: { cardCount: 1, firstHand: 1 },
        cards: [{ uid: "starter", name: "初動", count: 1, memo: "" }],
        patterns: [
          {
            uid: "p-base",
            name: "基礎",
            active: true,
            conditions: [{ mode: "required", count: 1, uids: ["starter"] }],
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
        settings: createSimulationSettings(0),
        vs: {
          enabled: true,
          opponentDeckSize: 1,
          opponentHandSize: 1,
          opponentDisruptions: [],
        },
      }),
    );

    expect(result.mode).toBe("simulation");
    expect(result.overallProbability).toBe("0.00");
    expect(result.patternSuccessRates).toEqual([
      { uid: "p-base", rate: "0.00" },
    ]);
    expect(result.vsBreakdown).toEqual({
      noDisruptionSuccessRate: "0.00",
      disruptedButPenetratedRate: "0.00",
      disruptedAndFailedRate: "0.00",
    });
  });

  it("supports draw_total with cap1/raw rules", () => {
    const result = calculateOpenerRateDomain(
      createCalculateInput({
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
            effects: [],
            memo: "",
          },
        ],
        subPatterns: [],
        labels: [],
      }),
    );

    expect(result.overallProbability).toBe("16.66");
    expect(result.patternSuccessRates).toEqual([
      { uid: "p-draw-total", rate: "16.66" },
    ]);
  });

  it("promotes label by sub pattern when trigger is satisfied", () => {
    const result = calculateOpenerRateDomain(
      createCalculateInput({
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
            effects: [],
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
      }),
    );

    expect(result.mode).toBe("exact");
    expect(result.overallProbability).toBe("50.00");
    expect(result.patternSuccessRates).toEqual([
      { uid: "p-base", rate: "50.00" },
    ]);
    expect(result.labelSuccessRates).toEqual([
      { uid: "l-penetrate", rate: "16.66" },
    ]);
  });

  it("promotes label by pattern effect when pattern is matched", () => {
    const result = calculateOpenerRateDomain(
      createCalculateInput({
        deck: { cardCount: 2, firstHand: 1 },
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
            effects: [{ type: "add_label", labelUids: ["l-pattern"] }],
            memo: "",
          },
        ],
        subPatterns: [],
        labels: [{ uid: "l-pattern", name: "パターン付与ラベル", memo: "" }],
      }),
    );

    expect(result.overallProbability).toBe("50.00");
    expect(result.patternSuccessRates).toEqual([
      { uid: "p-base", rate: "50.00" },
    ]);
    expect(result.labelSuccessRates).toEqual([
      { uid: "l-pattern", rate: "50.00" },
    ]);
  });

  it("computes vs breakdown with disruption penetration", () => {
    const result = calculateOpenerRateDomain(
      createCalculateInput({
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
            effects: [],
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
                disruptionCategoryUids: ["cat-ash"],
                amount: 1,
              },
            ],
            memo: "",
          },
        ],
        labels: [],
        settings: createSimulationSettings(),
        vs: {
          enabled: true,
          opponentDeckSize: 1,
          opponentHandSize: 1,
          opponentDisruptions: [
            {
              uid: "d-ash",
              disruptionCardUid: "dc-ash",
              disruptionCategoryUid: "cat-ash",
              name: "灰流うらら",
              count: 1,
              oncePerName: true,
            },
          ],
        },
      }),
    );

    expect(result.mode).toBe("simulation");
    expect(result.overallProbability).toBe("100.00");
    expect(result.vsBreakdown).toEqual({
      noDisruptionSuccessRate: "0.00",
      disruptedButPenetratedRate: "100.00",
      disruptedAndFailedRate: "0.00",
    });
  });

  it("applies pattern penetration effect in vs simulation", () => {
    const result = calculateOpenerRateDomain(
      createCalculateInput({
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
            effects: [
              {
                type: "add_penetration",
                disruptionCategoryUids: ["cat-negate"],
                amount: 1,
              },
            ],
            memo: "",
          },
        ],
        subPatterns: [],
        labels: [],
        settings: createSimulationSettings(),
        vs: {
          enabled: true,
          opponentDeckSize: 1,
          opponentHandSize: 1,
          opponentDisruptions: [
            {
              uid: "d-negate",
              disruptionCardUid: "dc-negate",
              disruptionCategoryUid: "cat-negate",
              name: "無効妨害",
              count: 1,
              oncePerName: true,
            },
          ],
        },
      }),
    );

    expect(result.mode).toBe("simulation");
    expect(result.overallProbability).toBe("100.00");
    expect(result.vsBreakdown).toEqual({
      noDisruptionSuccessRate: "0.00",
      disruptedButPenetratedRate: "100.00",
      disruptedAndFailedRate: "0.00",
    });
  });

  it("applies oncePerName in vs disruption count", () => {
    const baseInput = createCalculateInput({
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
          effects: [],
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
              disruptionCategoryUids: ["cat-ash"],
              amount: 1,
            },
          ],
          memo: "",
        },
      ],
      labels: [],
      settings: createSimulationSettings(),
    });

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
            disruptionCategoryUid: "cat-ash",
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
            disruptionCategoryUid: "cat-ash",
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

  it("collects penetrated disruption combinations", () => {
    const result = calculateOpenerRateDomain(
      createCalculateInput({
        deck: { cardCount: 1, firstHand: 1 },
        cards: [{ uid: "starter", name: "初動", count: 1, memo: "" }],
        patterns: [
          {
            uid: "p-base",
            name: "基礎",
            active: true,
            conditions: [{ mode: "required", count: 1, uids: ["starter"] }],
            labels: [],
            effects: [
              {
                type: "add_penetration",
                disruptionCategoryUids: ["cat-ash"],
                amount: 2,
              },
            ],
            memo: "",
          },
        ],
        subPatterns: [],
        labels: [],
        settings: createSimulationSettings(1),
        vs: {
          enabled: true,
          opponentDeckSize: 2,
          opponentHandSize: 2,
          opponentDisruptions: [
            {
              uid: "d-ash",
              disruptionCardUid: "dc-ash",
              disruptionCategoryUid: "cat-ash",
              name: "灰流うらら",
              count: 2,
              oncePerName: false,
            },
          ],
        },
      }),
    );

    expect(result.overallProbability).toBe("100.00");
    expect(result.vsPenetrationCombinations).toEqual([
      {
        combinationKey: "cat-ash:2",
        combinationLabel: "灰流うららx2",
        successCount: 1,
        occurrenceCount: 1,
        occurrenceRate: "100.00",
        successRate: "100.00",
      },
    ]);
  });

  it("caps opponent disruptions by opponent deck size", () => {
    const result = calculateOpenerRateDomain(
      createCalculateInput({
        deck: { cardCount: 1, firstHand: 1 },
        cards: [{ uid: "starter", name: "初動", count: 1, memo: "" }],
        patterns: [
          {
            uid: "p-base",
            name: "基礎",
            active: true,
            conditions: [{ mode: "required", count: 1, uids: ["starter"] }],
            labels: [],
            effects: [
              {
                type: "add_penetration",
                disruptionCategoryUids: ["cat-negate"],
                amount: 1,
              },
            ],
            memo: "",
          },
        ],
        subPatterns: [],
        labels: [],
        settings: createSimulationSettings(),
        vs: {
          enabled: true,
          opponentDeckSize: 1,
          opponentHandSize: 2,
          opponentDisruptions: [
            {
              uid: "d-negate",
              disruptionCardUid: "dc-negate",
              disruptionCategoryUid: "cat-negate",
              name: "無効妨害",
              count: 2,
              oncePerName: false,
            },
          ],
        },
      }),
    );

    expect(result.overallProbability).toBe("100.00");
    expect(result.vsBreakdown).toEqual({
      noDisruptionSuccessRate: "0.00",
      disruptedButPenetratedRate: "100.00",
      disruptedAndFailedRate: "0.00",
    });
  });

  it("supports grouped disruption penetration by category key", () => {
    const baseInput = createCalculateInput({
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
          effects: [],
          memo: "",
        },
      ],
      subPatterns: [
        {
          uid: "sp-group-penetrate",
          name: "無効2貫通",
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
              disruptionCategoryUids: ["cat-negate"],
              amount: 2,
            },
          ],
          memo: "",
        },
      ],
      labels: [],
      settings: createSimulationSettings(),
      vs: {
        enabled: true,
        opponentDeckSize: 2,
        opponentHandSize: 2,
        opponentDisruptions: [
          {
            uid: "d-imperm",
            disruptionCardUid: "dc-imperm",
            disruptionCategoryUid: "cat-negate",
            name: "無限泡影",
            count: 1,
            oncePerName: true,
          },
          {
            uid: "d-veiler",
            disruptionCardUid: "dc-veiler",
            disruptionCategoryUid: "cat-negate",
            name: "エフェクト・ヴェーラー",
            count: 1,
            oncePerName: true,
          },
        ],
      },
    });

    const penetrated = calculateOpenerRateDomain(baseInput);
    expect(penetrated.overallProbability).toBe("100.00");
    expect(penetrated.vsBreakdown?.disruptedButPenetratedRate).toBe("100.00");

    const notEnough = calculateOpenerRateDomain({
      ...baseInput,
      subPatterns: [
        {
          ...baseInput.subPatterns[0],
          effects: [
            {
              type: "add_penetration" as const,
              disruptionCategoryUids: ["cat-negate"],
              amount: 1,
            },
          ],
        },
      ],
    });
    expect(notEnough.overallProbability).toBe("0.00");
    expect(notEnough.vsBreakdown?.disruptedAndFailedRate).toBe("100.00");
  });

  it("matches disruption penetration by name key when category/card uid is absent", () => {
    const result = calculateOpenerRateDomain(
      createCalculateInput({
        deck: { cardCount: 1, firstHand: 1 },
        cards: [{ uid: "starter", name: "初動", count: 1, memo: "" }],
        patterns: [
          {
            uid: "p-base",
            name: "基礎",
            active: true,
            conditions: [{ mode: "required", count: 1, uids: ["starter"] }],
            labels: [],
            effects: [
              {
                type: "add_penetration",
                disruptionCategoryUids: ["Negate"],
                amount: 1,
              },
            ],
            memo: "",
          },
        ],
        subPatterns: [],
        labels: [],
        settings: createSimulationSettings(1),
        vs: {
          enabled: true,
          opponentDeckSize: 1,
          opponentHandSize: 1,
          opponentDisruptions: [
            {
              uid: "d-name-only",
              disruptionCardUid: undefined,
              disruptionCategoryUid: undefined,
              name: "Negate",
              count: 1,
              oncePerName: true,
            },
          ],
        },
      }),
    );

    expect(result.overallProbability).toBe("100.00");
    expect(result.vsBreakdown).toEqual({
      noDisruptionSuccessRate: "0.00",
      disruptedButPenetratedRate: "100.00",
      disruptedAndFailedRate: "0.00",
    });
  });

  it("does not consume prosperity when remaining deck is smaller than cost", () => {
    const result = calculateOpenerRateDomain(
      createCalculateInput({
        deck: { cardCount: 1, firstHand: 1 },
        cards: [],
        patterns: [
          {
            uid: "p-prosperity-in-hand",
            name: "金満が手札に残る",
            active: true,
            conditions: [
              {
                mode: "required",
                count: 1,
                uids: ["prosperity_card"],
              },
            ],
            labels: [],
            effects: [],
            memo: "",
          },
        ],
        subPatterns: [],
        labels: [],
        pot: {
          desiresOrExtravagance: { count: 0 },
          prosperity: { count: 1, cost: 6 },
        },
        settings: createSimulationSettings(),
      }),
    );

    expect(result.mode).toBe("simulation");
    expect(result.overallProbability).toBe("100.00");
    expect(result.patternSuccessRates).toEqual([
      { uid: "p-prosperity-in-hand", rate: "100.00" },
    ]);
  });

  it("selects the best reveal card when prosperity resolves", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    try {
      const result = calculateOpenerRateDomain(
        createCalculateInput({
          deck: { cardCount: 7, firstHand: 1 },
          cards: [{ uid: "target", name: "Target", count: 1, memo: "" }],
          patterns: [
            {
              uid: "p-target",
              name: "Targetを引く",
              active: true,
              conditions: [{ mode: "required", count: 1, uids: ["target"] }],
              labels: [],
              effects: [],
              memo: "",
            },
          ],
          subPatterns: [],
          labels: [],
          pot: {
            desiresOrExtravagance: { count: 0 },
            prosperity: { count: 1, cost: 6 },
          },
          settings: createSimulationSettings(1),
        }),
      );

      expect(result.mode).toBe("simulation");
      expect(result.overallProbability).toBe("100.00");
      expect(result.patternSuccessRates).toEqual([
        { uid: "p-target", rate: "100.00" },
      ]);
    } finally {
      randomSpy.mockRestore();
    }
  });

  it("prioritizes countable sub-pattern labels when selecting prosperity reveal", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    try {
      const result = calculateOpenerRateDomain(
        createCalculateInput({
          deck: { cardCount: 7, firstHand: 1 },
          cards: [{ uid: "a", name: "A", count: 1, memo: "" }],
          patterns: [
            {
              uid: "p-a",
              name: "Aを引く",
              active: true,
              conditions: [{ mode: "required", count: 1, uids: ["a"] }],
              labels: [],
              effects: [],
              memo: "",
            },
            {
              uid: "p-desires",
              name: "強欲を引く",
              active: true,
              conditions: [
                { mode: "required", count: 1, uids: ["desires_card"] },
              ],
              labels: [],
              effects: [],
              memo: "",
            },
          ],
          subPatterns: [
            {
              uid: "sp-a-label",
              name: "Aでラベル付与",
              active: true,
              basePatternUids: ["p-a"],
              triggerConditions: [
                {
                  mode: "required",
                  count: 1,
                  uids: ["a"],
                },
              ],
              triggerSourceUids: [],
              applyLimit: "once_per_trial",
              effects: [{ type: "add_label", labelUids: ["l-a"] }],
              memo: "",
            },
          ],
          labels: [{ uid: "l-a", name: "Aラベル", memo: "" }],
          pot: {
            desiresOrExtravagance: { count: 1 },
            prosperity: { count: 1, cost: 6 },
          },
          settings: createSimulationSettings(1),
        }),
      );

      expect(result.mode).toBe("simulation");
      expect(result.overallProbability).toBe("100.00");
      expect(result.patternSuccessRates).toEqual([
        { uid: "p-a", rate: "100.00" },
        { uid: "p-desires", rate: "0.00" },
      ]);
      expect(result.labelSuccessRates).toEqual([
        { uid: "l-a", rate: "100.00" },
      ]);
    } finally {
      randomSpy.mockRestore();
    }
  });

  it("falls back to desires draw when prosperity cannot resolve by cost", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    try {
      const result = calculateOpenerRateDomain(
        createCalculateInput({
          deck: { cardCount: 3, firstHand: 2 },
          cards: [{ uid: "target", name: "Target", count: 1, memo: "" }],
          patterns: [
            {
              uid: "p-target",
              name: "Targetを引く",
              active: true,
              conditions: [{ mode: "required", count: 1, uids: ["target"] }],
              labels: [],
              effects: [],
              memo: "",
            },
          ],
          subPatterns: [],
          labels: [],
          pot: {
            desiresOrExtravagance: { count: 1 },
            prosperity: { count: 1, cost: 3 },
          },
          settings: createSimulationSettings(1),
        }),
      );

      expect(result.mode).toBe("simulation");
      expect(result.overallProbability).toBe("100.00");
      expect(result.patternSuccessRates).toEqual([
        { uid: "p-target", rate: "100.00" },
      ]);
    } finally {
      randomSpy.mockRestore();
    }
  });

  it("applies base_match_total even when base pattern has no matched-card usage details", () => {
    const result = calculateOpenerRateDomain(
      createCalculateInput({
        deck: { cardCount: 2, firstHand: 1 },
        cards: [{ uid: "a", name: "A", count: 1, memo: "" }],
        patterns: [
          {
            uid: "p-draw-total",
            name: "Aを引いた",
            active: true,
            conditions: [
              {
                mode: "draw_total",
                operator: "gte",
                threshold: 1,
                rules: [{ uids: ["a"], mode: "raw" }],
              },
            ],
            labels: [],
            effects: [],
            memo: "",
          },
        ],
        subPatterns: [
          {
            uid: "sp-base-match-total",
            name: "成立内A",
            active: true,
            basePatternUids: ["p-draw-total"],
            triggerConditions: [
              {
                mode: "base_match_total",
                operator: "gte",
                threshold: 1,
                rules: [{ uids: ["a"], mode: "raw" }],
              },
            ],
            triggerSourceUids: [],
            applyLimit: "once_per_trial",
            effects: [{ type: "add_label", labelUids: ["l-hit"] }],
            memo: "",
          },
        ],
        labels: [{ uid: "l-hit", name: "成立内ラベル", memo: "" }],
      }),
    );

    expect(result.mode).toBe("exact");
    expect(result.patternSuccessRates).toEqual([
      { uid: "p-draw-total", rate: "50.00" },
    ]);
    expect(result.labelSuccessRates).toEqual([{ uid: "l-hit", rate: "50.00" }]);
  });
});
