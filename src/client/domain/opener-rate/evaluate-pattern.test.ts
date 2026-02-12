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

  it("fails not_drawn when any target index is in hand", () => {
    const patterns: CompiledPattern[] = [
      {
        uid: "p1",
        name: "Aを引いていない",
        active: true,
        excludeFromOverall: false,
        conditions: [
          {
            mode: "not_drawn",
            count: 1,
            uids: ["a"],
            indices: [0],
          },
        ],
        labels: [],
        effects: [],
        memo: "",
      },
    ];

    const matched = evaluatePatterns(patterns, createContext([0]));
    const notMatched = evaluatePatterns(patterns, createContext([1]));

    expect(matched.matchedPatternUids).toEqual(["p1"]);
    expect(notMatched.matchedPatternUids).toEqual([]);
  });

  it("evaluates remain_total from deckCounts", () => {
    const patterns: CompiledPattern[] = [
      {
        uid: "p1",
        name: "残り枚数チェック",
        active: true,
        excludeFromOverall: false,
        conditions: [
          {
            mode: "remain_total",
            operator: "eq",
            threshold: 1,
            rules: [{ mode: "cap1", indices: [0] }],
          },
        ],
        labels: [],
        effects: [],
        memo: "",
      },
    ];

    const matched = evaluatePatterns(patterns, createContext([0], [2]));
    const notMatched = evaluatePatterns(patterns, createContext([0], [0]));

    expect(matched.matchedPatternUids).toEqual(["p1"]);
    expect(notMatched.matchedPatternUids).toEqual([]);
  });

  it("evaluates leave_deck from remaining deck card counts", () => {
    const patterns: CompiledPattern[] = [
      {
        uid: "p1",
        name: "デッキに残す",
        active: true,
        excludeFromOverall: false,
        conditions: [
          {
            mode: "leave_deck",
            count: 1,
            uids: ["a"],
            indices: [0],
          },
        ],
        labels: [],
        effects: [],
        memo: "",
      },
    ];

    const matched = evaluatePatterns(patterns, createContext([0], [1]));
    const notMatched = evaluatePatterns(patterns, createContext([0], [0]));

    expect(matched.matchedPatternUids).toEqual(["p1"]);
    expect(notMatched.matchedPatternUids).toEqual([]);
  });

  it("prevents double-using the same card across required conditions", () => {
    const patterns: CompiledPattern[] = [
      {
        uid: "p1",
        name: "A + (A or B)",
        active: true,
        excludeFromOverall: false,
        conditions: [
          {
            mode: "required",
            count: 1,
            uids: ["a"],
            indices: [0],
          },
          {
            mode: "required",
            count: 1,
            uids: ["a", "b"],
            indices: [0, 1],
          },
        ],
        labels: [],
        effects: [],
        memo: "",
      },
    ];

    const notMatched = evaluatePatterns(patterns, createContext([1, 0]));
    const matched = evaluatePatterns(patterns, createContext([1, 1]));

    expect(notMatched.matchedPatternUids).toEqual([]);
    expect(matched.matchedPatternUids).toEqual(["p1"]);
    expect(matched.matchedCardCountsByPatternUid.p1).toEqual({
      0: 1,
      1: 1,
    });
  });
});
