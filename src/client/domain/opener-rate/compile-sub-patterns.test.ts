import { describe, expect, it } from "vitest";

import type { CalculateInput } from "../../../shared/apiSchemas";
import { compileSubPatterns } from "./compile-sub-patterns";
import { normalizeCalculateInput } from "./normalize";

const createInput = (): CalculateInput => ({
  deck: { cardCount: 40, firstHand: 5 },
  cards: [
    { uid: "a", name: "A", count: 3, memo: "" },
    { uid: "b", name: "B", count: 3, memo: "" },
  ],
  patterns: [
    {
      uid: "p1",
      name: "base",
      active: true,
      conditions: [{ mode: "required", count: 1, uids: ["a"] }],
      labels: [],
      effects: [],
      memo: "",
    },
  ],
  subPatterns: [
    {
      uid: "sp1",
      name: "sub",
      active: true,
      basePatternUids: ["p1"],
      triggerConditions: [
        {
          mode: "required",
          count: 1,
          uids: ["a", "missing"],
        },
        {
          mode: "base_match_total",
          operator: "gte",
          threshold: 1,
          rules: [{ uids: ["b", "missing"], mode: "raw" }],
        },
      ],
      triggerSourceUids: ["a", "a", "missing", "b"],
      applyLimit: "once_per_distinct_uid",
      effects: [{ type: "add_label", labelUids: ["l1"] }],
      memo: "",
    },
  ],
  labels: [{ uid: "l1", name: "L1", memo: "" }],
  pot: {
    desiresOrExtravagance: { count: 0 },
    prosperity: { count: 0, cost: 6 },
  },
  settings: {
    mode: "exact",
    simulationTrials: 1000,
  },
});

describe("compileSubPatterns", () => {
  it("compiles trigger conditions and deduplicates trigger source indices", () => {
    const normalized = normalizeCalculateInput(createInput());
    expect(normalized.ok).toBe(true);
    if (!normalized.ok) return;

    const uidToIndex = normalized.value.uidToIndex;
    const aIndex = uidToIndex.get("a");
    const bIndex = uidToIndex.get("b");
    expect(aIndex).not.toBeUndefined();
    expect(bIndex).not.toBeUndefined();

    const compiled = compileSubPatterns(normalized.value);
    expect(compiled).toHaveLength(1);

    expect(compiled[0]?.triggerSourceIndices).toEqual([
      aIndex ?? -1,
      bIndex ?? -1,
    ]);
    expect(compiled[0]?.hasTriggerSourceUids).toBe(true);
    expect(compiled[0]?.triggerConditions).toEqual([
      {
        mode: "required",
        count: 1,
        uids: ["a", "missing"],
        indices: [aIndex ?? -1],
      },
      {
        mode: "base_match_total",
        operator: "gte",
        threshold: 1,
        rules: [{ mode: "raw", indices: [bIndex ?? -1] }],
      },
    ]);
  });
});
