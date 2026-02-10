import { describe, expect, it } from "vitest";

import { calculateOpenerRate } from "./calculation-service";

describe("calculateOpenerRate", () => {
  it("returns card_count_exceeded when deck size is smaller than total cards", () => {
    const result = calculateOpenerRate({
      deck: { cardCount: 40, firstHand: 5 },
      cards: [
        { uid: "a", name: "A", count: 39, memo: "" },
        { uid: "b", name: "B", count: 3, memo: "" },
      ],
      patterns: [
        {
          uid: "p1",
          name: "P1",
          active: true,
          conditions: [],
          labels: [],
          memo: "",
        },
      ],
      subPatterns: [],
      labels: [{ uid: "l1", name: "L1", memo: "" }],
      pot: {
        desiresOrExtravagance: { count: 0 },
        prosperity: { count: 0, cost: 6 },
      },
      settings: {
        mode: "simulation",
        simulationTrials: 10000,
      },
    });

    expect(result.error?.type).toBe("card_count_exceeded");
    expect(result.error?.deckSize).toBe(40);
    expect(result.error?.totalCards).toBe(42);
    expect(result.overallProbability).toBe("0.00");
  });

  it("falls back to simulation when exact + pot is requested", () => {
    const result = calculateOpenerRate({
      deck: { cardCount: 40, firstHand: 5 },
      cards: [{ uid: "a", name: "A", count: 3, memo: "" }],
      patterns: [
        {
          uid: "p1",
          name: "P1",
          active: true,
          conditions: [],
          labels: [],
          memo: "",
        },
        {
          uid: "p2",
          name: "P2",
          active: false,
          conditions: [],
          labels: [],
          memo: "",
        },
      ],
      subPatterns: [],
      labels: [{ uid: "l1", name: "L1", memo: "" }],
      pot: {
        desiresOrExtravagance: { count: 0 },
        prosperity: { count: 1, cost: 3 },
      },
      settings: {
        mode: "exact",
        simulationTrials: 20000,
      },
    });

    expect(result.error).toBeUndefined();
    expect(result.mode).toBe("simulation");
    expect(result.overallProbability).toBe("100.00");
    expect(result.patternSuccessRates).toEqual([
      { uid: "p1", rate: "100.00" },
      { uid: "p2", rate: "0.00" },
    ]);
    expect(result.labelSuccessRates).toEqual([{ uid: "l1", rate: "0.00" }]);
  });

  it("falls back to simulation when exact + vs is requested", () => {
    const result = calculateOpenerRate({
      deck: { cardCount: 1, firstHand: 1 },
      cards: [{ uid: "a", name: "A", count: 1, memo: "" }],
      patterns: [
        {
          uid: "p1",
          name: "P1",
          active: true,
          conditions: [{ mode: "required", count: 1, uids: ["a"] }],
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
        simulationTrials: 1000,
      },
      vs: {
        enabled: true,
        opponentDeckSize: 1,
        opponentHandSize: 1,
        opponentDisruptions: [
          {
            uid: "d1",
            disruptionCardUid: "dc-1",
            name: "妨害",
            count: 1,
            oncePerName: true,
          },
        ],
      },
    });

    expect(result.mode).toBe("simulation");
    expect(result.vsBreakdown).toBeDefined();
  });
});
