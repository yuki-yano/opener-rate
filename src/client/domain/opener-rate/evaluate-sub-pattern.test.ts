import { describe, expect, it } from "vitest";

import { evaluatePatterns } from "./evaluate-pattern";
import { evaluateSubPatterns } from "./evaluate-sub-pattern";
import type { CompiledPattern, CompiledSubPattern } from "./types";

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
            disruptionCategoryUids: ["cat-negate"],
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

    expect(result.penetrationByDisruptionKey).toEqual({ "cat-negate": 1 });
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
            disruptionCategoryUids: ["cat-negate"],
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

    expect(result.penetrationByDisruptionKey).toEqual({ "cat-negate": 2 });
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

  it("applies base_match_total when any matched base pattern satisfies", () => {
    const compiledSubPatterns: CompiledSubPattern[] = [
      {
        uid: "sp1",
        name: "成立内ヨクル",
        active: true,
        basePatternUids: ["p1", "p2"],
        triggerConditions: [
          {
            mode: "base_match_total",
            operator: "gte",
            threshold: 1,
            rules: [{ mode: "raw", indices: [2] }],
          },
        ],
        triggerSourceIndices: [],
        applyLimit: "once_per_trial",
        effects: [{ type: "add_label", labelUids: ["l-hit"] }],
        memo: "",
      },
    ];

    const result = evaluateSubPatterns({
      compiledSubPatterns,
      context: createContext([0, 0, 1]),
      matchedPatternUids: ["p1", "p2"],
      matchedCardCountsByPatternUid: {
        p1: { 1: 1 },
        p2: { 2: 1 },
      },
    });

    expect(result.addedLabelUids).toEqual(["l-hit"]);
  });

  it("does not apply base_match_total when no matched base pattern satisfies", () => {
    const compiledSubPatterns: CompiledSubPattern[] = [
      {
        uid: "sp1",
        name: "成立内ヨクル",
        active: true,
        basePatternUids: ["p1"],
        triggerConditions: [
          {
            mode: "base_match_total",
            operator: "eq",
            threshold: 1,
            rules: [{ mode: "raw", indices: [2] }],
          },
        ],
        triggerSourceIndices: [],
        applyLimit: "once_per_trial",
        effects: [{ type: "add_label", labelUids: ["l-hit"] }],
        memo: "",
      },
    ];

    const result = evaluateSubPatterns({
      compiledSubPatterns,
      context: createContext([0, 0, 1]),
      matchedPatternUids: ["p1"],
      matchedCardCountsByPatternUid: {
        p1: { 1: 1 },
      },
    });

    expect(result.addedLabelUids).toEqual([]);
  });

  it("evaluates base_match_total from hand counts when matched card usage is unavailable", () => {
    const compiledSubPatterns: CompiledSubPattern[] = [
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
            rules: [{ mode: "raw", indices: [2] }],
          },
        ],
        triggerSourceIndices: [],
        applyLimit: "once_per_trial",
        effects: [{ type: "add_label", labelUids: ["l-hit"] }],
        memo: "",
      },
    ];

    const result = evaluateSubPatterns({
      compiledSubPatterns,
      context: createContext([0, 0, 1]),
      matchedPatternUids: ["p1"],
      matchedCardCountsByPatternUid: {
        p1: {},
      },
    });

    expect(result.addedLabelUids).toEqual(["l-hit"]);
  });

  it("works with matched-card usage produced by evaluatePatterns", () => {
    const compiledPatterns: CompiledPattern[] = [
      {
        uid: "p1",
        name: "初動A+B",
        active: true,
        excludeFromOverall: false,
        conditions: [
          { mode: "required", count: 1, uids: ["a"], indices: [1] },
          { mode: "required_distinct", count: 1, uids: ["b"], indices: [2] },
        ],
        labels: [],
        effects: [],
        memo: "",
      },
    ];
    const patternEvaluation = evaluatePatterns(
      compiledPatterns,
      createContext([0, 1, 1]),
    );
    const compiledSubPatterns: CompiledSubPattern[] = [
      {
        uid: "sp1",
        name: "成立内B",
        active: true,
        basePatternUids: ["p1"],
        triggerConditions: [
          {
            mode: "base_match_total",
            operator: "eq",
            threshold: 1,
            rules: [{ mode: "raw", indices: [2] }],
          },
        ],
        triggerSourceIndices: [],
        applyLimit: "once_per_trial",
        effects: [{ type: "add_label", labelUids: ["l-hit"] }],
        memo: "",
      },
    ];

    const result = evaluateSubPatterns({
      compiledSubPatterns,
      context: createContext([0, 1, 1]),
      matchedPatternUids: patternEvaluation.matchedPatternUids,
      matchedCardCountsByPatternUid:
        patternEvaluation.matchedCardCountsByPatternUid,
    });

    expect(result.addedLabelUids).toEqual(["l-hit"]);
  });
});
