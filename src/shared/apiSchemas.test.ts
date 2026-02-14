import { describe, expect, it } from "vitest";

import { calculateInputSchema, shortenUrlRequestSchema } from "./apiSchemas";

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
          effects: [],
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
      subPatterns: [],
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
      subPatterns: [],
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
          effects: [],
          conditions: [
            {
              mode: "required",
              count: 1,
              uids: ["a"],
            },
          ],
        },
      ],
      subPatterns: [],
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

  it("accepts sub pattern for conditional label promotion", () => {
    const result = calculateInputSchema.safeParse({
      deck: { cardCount: 40, firstHand: 5 },
      cards: [
        { uid: "grave", name: "墓穴", count: 1, memo: "" },
        { uid: "starter", name: "初動", count: 3, memo: "" },
      ],
      patterns: [
        {
          uid: "p1",
          name: "初動成立",
          active: true,
          memo: "",
          labels: [],
          effects: [],
          conditions: [
            {
              mode: "required",
              count: 1,
              uids: ["starter"],
            },
          ],
        },
      ],
      subPatterns: [
        {
          uid: "sp1",
          name: "with墓穴",
          active: true,
          basePatternUids: ["p1"],
          triggerConditions: [
            {
              mode: "required",
              count: 1,
              uids: ["grave"],
            },
          ],
          triggerSourceUids: ["grave"],
          applyLimit: "once_per_distinct_uid",
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
        mode: "simulation",
        simulationTrials: 1000,
      },
    });

    expect(result.success).toBe(true);
  });

  it("accepts base_match_total in sub pattern trigger conditions", () => {
    const result = calculateInputSchema.safeParse({
      deck: { cardCount: 40, firstHand: 5 },
      cards: [
        { uid: "starter", name: "初動", count: 3, memo: "" },
        { uid: "yokuru", name: "ヨクル", count: 1, memo: "" },
      ],
      patterns: [
        {
          uid: "p1",
          name: "初動成立",
          active: true,
          memo: "",
          labels: [],
          effects: [],
          conditions: [{ mode: "required", count: 1, uids: ["starter"] }],
        },
      ],
      subPatterns: [
        {
          uid: "sp1",
          name: "成立内ヨクル",
          active: true,
          basePatternUids: ["p1"],
          triggerConditions: [
            {
              mode: "base_match_total",
              operator: "gte",
              threshold: 1,
              rules: [{ mode: "raw", uids: ["yokuru"] }],
            },
          ],
          triggerSourceUids: ["yokuru"],
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
        mode: "simulation",
        simulationTrials: 1000,
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects base_match_total in main pattern conditions", () => {
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
          effects: [],
          conditions: [
            {
              mode: "base_match_total",
              operator: "gte",
              threshold: 1,
              rules: [{ mode: "raw", uids: ["a"] }],
            },
          ],
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
        simulationTrials: 1000,
      },
    });

    expect(result.success).toBe(false);
  });

  it("accepts draft conditions with empty uids for editing state", () => {
    const result = calculateInputSchema.safeParse({
      deck: { cardCount: 40, firstHand: 5 },
      cards: [],
      patterns: [
        {
          uid: "p1",
          name: "P1",
          active: true,
          memo: "",
          labels: [],
          effects: [],
          conditions: [
            {
              mode: "required",
              count: 1,
              uids: [],
            },
          ],
        },
      ],
      subPatterns: [
        {
          uid: "sp1",
          name: "SP1",
          active: true,
          basePatternUids: ["p1"],
          triggerConditions: [
            {
              mode: "required",
              count: 1,
              uids: [],
            },
          ],
          triggerSourceUids: [],
          applyLimit: "once_per_trial",
          effects: [
            {
              type: "add_penetration",
              disruptionCategoryUids: ["cat-negate"],
              amount: 1,
              poolId: "shared-negate",
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
    });

    expect(result.success).toBe(true);
  });

  it("accepts vs simulation settings", () => {
    const result = calculateInputSchema.safeParse({
      deck: { cardCount: 40, firstHand: 5 },
      cards: [{ uid: "starter", name: "初動", count: 3, memo: "" }],
      patterns: [
        {
          uid: "p1",
          name: "初動",
          active: true,
          memo: "",
          labels: [],
          effects: [],
          conditions: [{ mode: "required", count: 1, uids: ["starter"] }],
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
        simulationTrials: 1000,
      },
      vs: {
        enabled: true,
        opponentDeckSize: 40,
        opponentHandSize: 5,
        opponentDisruptions: [
          {
            uid: "d1",
            name: "灰流うらら",
            count: 3,
            oncePerName: true,
          },
        ],
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects vs when opponent hand size exceeds deck size", () => {
    const result = calculateInputSchema.safeParse({
      deck: { cardCount: 40, firstHand: 5 },
      cards: [],
      patterns: [],
      subPatterns: [],
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
        opponentDeckSize: 4,
        opponentHandSize: 5,
        opponentDisruptions: [],
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects vs when opponent disruption total exceeds deck size", () => {
    const result = calculateInputSchema.safeParse({
      deck: { cardCount: 40, firstHand: 5 },
      cards: [],
      patterns: [],
      subPatterns: [],
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
        opponentDeckSize: 3,
        opponentHandSize: 3,
        opponentDisruptions: [
          {
            uid: "d1",
            name: "妨害A",
            count: 2,
            oncePerName: false,
          },
          {
            uid: "d2",
            name: "妨害B",
            count: 2,
            oncePerName: true,
          },
        ],
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects vs when the same disruptionCardUid is registered multiple times", () => {
    const result = calculateInputSchema.safeParse({
      deck: { cardCount: 40, firstHand: 5 },
      cards: [],
      patterns: [],
      subPatterns: [],
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
        opponentDeckSize: 40,
        opponentHandSize: 5,
        opponentDisruptions: [
          {
            uid: "d1",
            disruptionCardUid: "dc-imperm",
            name: "無限泡影",
            count: 3,
            oncePerName: true,
          },
          {
            uid: "d2",
            disruptionCardUid: "dc-imperm",
            name: "無限泡影",
            count: 1,
            oncePerName: true,
          },
        ],
      },
    });

    expect(result.success).toBe(false);
  });

  it("accepts only http/https for shortenUrlRequest", () => {
    expect(
      shortenUrlRequestSchema.safeParse({ url: "https://example.com/path" })
        .success,
    ).toBe(true);
    expect(
      shortenUrlRequestSchema.safeParse({ url: "http://localhost:5173/" })
        .success,
    ).toBe(true);
    expect(
      shortenUrlRequestSchema.safeParse({ url: "javascript:alert(1)" }).success,
    ).toBe(false);
    expect(
      shortenUrlRequestSchema.safeParse({ url: "data:text/html,test" }).success,
    ).toBe(false);
    expect(
      shortenUrlRequestSchema.safeParse({ url: "ftp://example.com/path" })
        .success,
    ).toBe(false);
  });
});
