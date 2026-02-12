import { describe, expect, it } from "vitest";

import type { CompiledPattern } from "./types";
import { evaluatePatterns } from "./evaluate-pattern";

const createContext = (handCounts: number[], deckCounts?: number[]) => ({
  handCounts,
  deckCounts: deckCounts ?? new Array(handCounts.length).fill(0),
});

describe("evaluatePatterns", () => {
  it("matches required_distinct by counting distinct drawn indices", () => {
    const patterns: CompiledPattern[] = [
      {
        uid: "p1",
        name: "A or B + C",
        active: true,
        excludeFromOverall: false,
        conditions: [
          {
            mode: "required_distinct",
            count: 2,
            uids: ["a", "b", "c"],
            indices: [3, 1, 3, 2],
          },
        ],
        labels: [],
        effects: [],
        memo: "",
      },
    ];

    const matched = evaluatePatterns(patterns, createContext([0, 1, 0, 1]));
    const notMatched = evaluatePatterns(patterns, createContext([0, 0, 0, 1]));

    expect(matched.matchedPatternUids).toEqual(["p1"]);
    expect(notMatched.matchedPatternUids).toEqual([]);
  });

  it("records all distinct required_distinct indices for matched card details", () => {
    const patterns: CompiledPattern[] = [
      {
        uid: "p1",
        name: "A+B+C",
        active: true,
        excludeFromOverall: false,
        conditions: [
          {
            mode: "required_distinct",
            count: 2,
            uids: ["a", "b", "c"],
            indices: [1, 2, 3],
          },
        ],
        labels: [],
        effects: [],
        memo: "",
      },
    ];

    const result = evaluatePatterns(patterns, createContext([0, 1, 1, 1]));

    expect(result.matchedPatternUids).toEqual(["p1"]);
    expect(result.matchedCardCountsByPatternUid.p1).toEqual({
      1: 1,
      2: 1,
      3: 1,
    });
  });
});
