import { describe, expect, it } from "vitest";

import { calculateInputSchema } from "./apiSchemas";

describe("apiSchemas", () => {
  it("accepts draw_total and remain_total count conditions", () => {
    const result = calculateInputSchema.safeParse({
      deck: { cardCount: 40, firstHand: 5 },
      cards: [{ uid: "a", name: "A", count: 3, memo: "" }],
      patterns: [
        {
          uid: "p1",
          name: "P1",
          active: true,
          memo: "",
          labels: [],
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
            {
              mode: "remain_total",
              operator: "eq",
              threshold: 1,
              rules: [{ uids: ["a"], mode: "raw" }],
            },
          ],
        },
      ],
      labels: [],
      pot: {
        desiresOrExtravagance: { count: 0 },
        prosperity: { count: 0, cost: 6 },
      },
      settings: {
        mode: "simulation",
        simulationTrials: 10000,
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects firstHand greater than cardCount", () => {
    const result = calculateInputSchema.safeParse({
      deck: { cardCount: 5, firstHand: 6 },
      cards: [],
      patterns: [],
      labels: [],
      pot: {
        desiresOrExtravagance: { count: 0 },
        prosperity: { count: 0, cost: 6 },
      },
      settings: {
        mode: "simulation",
        simulationTrials: 1000,
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects blank names for cards/patterns/labels", () => {
    const result = calculateInputSchema.safeParse({
      deck: { cardCount: 40, firstHand: 5 },
      cards: [{ uid: "a", name: "   ", count: 3, memo: "" }],
      patterns: [
        {
          uid: "p1",
          name: "",
          active: true,
          memo: "",
          labels: [{ uid: "l1" }],
          conditions: [
            {
              mode: "required",
              count: 1,
              uids: ["a"],
            },
          ],
        },
      ],
      labels: [{ uid: "l1", name: " ", memo: "" }],
      pot: {
        desiresOrExtravagance: { count: 0 },
        prosperity: { count: 0, cost: 6 },
      },
      settings: {
        mode: "simulation",
        simulationTrials: 1000,
      },
    });

    expect(result.success).toBe(false);
  });
});
