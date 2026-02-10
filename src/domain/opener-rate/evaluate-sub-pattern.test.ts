import { describe, expect, it } from "vitest";

import { evaluateSubPatterns } from "./evaluate-sub-pattern";
import type { CompiledSubPattern } from "./types";

const createContext = (handCounts: number[], deckCounts?: number[]) => ({
  handCounts,
  deckCounts: deckCounts ?? new Array(handCounts.length).fill(0),
});

describe("evaluateSubPatterns", () => {
  it("applies once_per_trial at most once", () => {
    const compiledSubPatterns: CompiledSubPattern[] = [
      {
        uid: "sp1",
        name: "with墓穴",
        active: true,
        basePatternUids: ["p1"],
        triggerConditions: [
          { mode: "required", count: 1, uids: ["grave"], indices: [1] },
        ],
        triggerSourceIndices: [1, 2],
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
    ];

    const result = evaluateSubPatterns({
      compiledSubPatterns,
      context: createContext([0, 1, 1]),
      matchedPatternUids: ["p1"],
    });

    expect(result.penetrationByDisruptionKey).toEqual({ "dc-ash": 1 });
  });

  it("applies once_per_distinct_uid by distinct drawn sources", () => {
    const compiledSubPatterns: CompiledSubPattern[] = [
      {
        uid: "sp1",
        name: "with墓穴",
        active: true,
        basePatternUids: ["p1"],
        triggerConditions: [
          { mode: "required", count: 1, uids: ["grave"], indices: [1] },
        ],
        triggerSourceIndices: [1, 2],
        applyLimit: "once_per_distinct_uid",
        effects: [
          {
            type: "add_penetration",
            disruptionCardUids: ["dc-ash"],
            amount: 1,
          },
        ],
        memo: "",
      },
    ];

    const result = evaluateSubPatterns({
      compiledSubPatterns,
      context: createContext([0, 2, 1]),
      matchedPatternUids: ["p1"],
    });

    expect(result.penetrationByDisruptionKey).toEqual({ "dc-ash": 2 });
  });

  it("does not apply when base pattern is not matched", () => {
    const compiledSubPatterns: CompiledSubPattern[] = [
      {
        uid: "sp1",
        name: "with墓穴",
        active: true,
        basePatternUids: ["p1"],
        triggerConditions: [
          { mode: "required", count: 1, uids: ["grave"], indices: [1] },
        ],
        triggerSourceIndices: [1],
        applyLimit: "once_per_trial",
        effects: [{ type: "add_label", labelUids: ["l-penetrate"] }],
        memo: "",
      },
    ];

    const result = evaluateSubPatterns({
      compiledSubPatterns,
      context: createContext([0, 1]),
      matchedPatternUids: ["p-other"],
    });

    expect(result.addedLabelUids).toEqual([]);
  });
});
