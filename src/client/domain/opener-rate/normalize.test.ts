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
});
