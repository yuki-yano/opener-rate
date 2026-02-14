import { describe, expect, it } from "vitest";

import type { CalculateInput } from "../../../shared/apiSchemas";
import { normalizeCalculateInput } from "./normalize";
import { DESIRES_UID, PROSPERITY_UID, UNKNOWN_UID } from "./types";

const createBaseInput = (): CalculateInput => ({
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
    mode: "exact",
    simulationTrials: 1000,
  },
});

describe("normalizeCalculateInput", () => {
  it("adds pot cards and unknown cards with stable indices", () => {
    const input: CalculateInput = {
      ...createBaseInput(),
      deck: { cardCount: 8, firstHand: 5 },
      cards: [{ uid: "a", name: "A", count: 3, memo: "" }],
      pot: {
        desiresOrExtravagance: { count: 1 },
        prosperity: { count: 2, cost: 6 },
      },
    };

    const normalized = normalizeCalculateInput(input);
    expect(normalized.ok).toBe(true);
    if (!normalized.ok) return;

    expect(normalized.value.indexToUid).toEqual([
      "a",
      PROSPERITY_UID,
      DESIRES_UID,
      UNKNOWN_UID,
    ]);
    expect(normalized.value.deckCounts).toEqual([3, 2, 1, 2]);
    expect(normalized.value.prosperityIndex).toBe(1);
    expect(normalized.value.desiresIndex).toBe(2);
  });

  it("returns card_count_exceeded style error when explicit cards exceed deck size", () => {
    const input: CalculateInput = {
      ...createBaseInput(),
      deck: { cardCount: 3, firstHand: 3 },
      cards: [{ uid: "a", name: "A", count: 3, memo: "" }],
      pot: {
        desiresOrExtravagance: { count: 1 },
        prosperity: { count: 0, cost: 6 },
      },
    };

    const normalized = normalizeCalculateInput(input);

    expect(normalized.ok).toBe(false);
    if (normalized.ok) return;
    expect(normalized.error).toEqual({
      deckSize: 3,
      totalCards: 4,
      excess: 1,
    });
  });

  it("auto-complements shared poolId for legacy penetration effects", () => {
    const input: CalculateInput = {
      ...createBaseInput(),
      patterns: [
        {
          uid: "p-legacy",
          name: "legacy",
          active: true,
          excludeFromOverall: false,
          conditions: [
            {
              mode: "required",
              count: 1,
              uids: [],
            },
          ],
          labels: [],
          effects: [
            {
              type: "add_penetration",
              disruptionCategoryUids: ["cat-a"],
              amount: 1,
            },
            {
              type: "add_penetration",
              disruptionCategoryUids: ["cat-b"],
              amount: 1,
            },
          ],
          memo: "",
        },
      ],
      subPatterns: [
        {
          uid: "sp-legacy",
          name: "legacy-sub",
          active: true,
          basePatternUids: [],
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
              disruptionCategoryUids: ["cat-c"],
              amount: 1,
            },
            {
              type: "add_penetration",
              disruptionCategoryUids: ["cat-d"],
              amount: 1,
            },
          ],
          memo: "",
        },
      ],
    };

    const normalized = normalizeCalculateInput(input);
    expect(normalized.ok).toBe(true);
    if (!normalized.ok) return;

    const patternEffects = normalized.value.patterns[0]?.effects;
    expect(patternEffects).toBeDefined();
    const patternPenetrations = patternEffects?.filter(
      (effect) => effect.type === "add_penetration",
    );
    expect(patternPenetrations).toHaveLength(2);
    expect(patternPenetrations?.[0]?.poolId).toBe("__legacy_pool__:pattern:0");
    expect(patternPenetrations?.[1]?.poolId).toBe("__legacy_pool__:pattern:0");

    const subPatternPenetrations =
      normalized.value.subPatterns[0]?.effects.filter(
        (effect) => effect.type === "add_penetration",
      );
    expect(subPatternPenetrations).toHaveLength(2);
    expect(subPatternPenetrations?.[0]?.poolId).toBe(
      "__legacy_pool__:sub_pattern:0",
    );
    expect(subPatternPenetrations?.[1]?.poolId).toBe(
      "__legacy_pool__:sub_pattern:0",
    );
  });

  it("does not override explicit poolId in penetration effects", () => {
    const input: CalculateInput = {
      ...createBaseInput(),
      patterns: [
        {
          uid: "p-explicit",
          name: "explicit",
          active: true,
          excludeFromOverall: false,
          conditions: [
            {
              mode: "required",
              count: 1,
              uids: [],
            },
          ],
          labels: [],
          effects: [
            {
              type: "add_penetration",
              disruptionCategoryUids: ["cat-a"],
              amount: 1,
              poolId: "user_pool",
            },
            {
              type: "add_penetration",
              disruptionCategoryUids: ["cat-b"],
              amount: 1,
            },
          ],
          memo: "",
        },
      ],
    };

    const normalized = normalizeCalculateInput(input);
    expect(normalized.ok).toBe(true);
    if (!normalized.ok) return;

    const patternEffects = normalized.value.patterns[0]?.effects;
    const first = patternEffects?.[0];
    const second = patternEffects?.[1];
    expect(first?.type).toBe("add_penetration");
    expect(second?.type).toBe("add_penetration");
    if (first?.type === "add_penetration") {
      expect(first.poolId).toBe("user_pool");
    }
    if (second?.type === "add_penetration") {
      expect(second.poolId).toBeUndefined();
    }
  });
});
