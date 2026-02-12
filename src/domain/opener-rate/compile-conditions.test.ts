import { describe, expect, it } from "vitest";

import type {
  PatternCondition,
  SubPatternTriggerCondition,
} from "../../shared/apiSchemas";
import {
  compilePatternConditions,
  compileSubPatternTriggerConditions,
  toIndices,
} from "./compile-conditions";

describe("compile-conditions", () => {
  it("converts uid list to index list and ignores unknown uids", () => {
    const uidToIndex = new Map([
      ["a", 0],
      ["b", 1],
    ]);

    expect(toIndices(uidToIndex, ["a", "missing", "b", "a"])).toEqual([
      0, 1, 0,
    ]);
  });

  it("compiles pattern conditions with index-based rules", () => {
    const uidToIndex = new Map([
      ["a", 0],
      ["b", 1],
    ]);
    const conditions: PatternCondition[] = [
      {
        mode: "required",
        count: 2,
        uids: ["a", "missing", "b"],
      },
      {
        mode: "draw_total",
        operator: "gte",
        threshold: 1,
        rules: [{ uids: ["missing", "b"], mode: "cap1" }],
      },
    ];

    const compiled = compilePatternConditions(uidToIndex, conditions);

    expect(compiled).toEqual([
      {
        mode: "required",
        count: 2,
        uids: ["a", "missing", "b"],
        indices: [0, 1],
      },
      {
        mode: "draw_total",
        operator: "gte",
        threshold: 1,
        rules: [{ mode: "cap1", indices: [1] }],
      },
    ]);
  });

  it("keeps base_match_total in sub pattern trigger compilation", () => {
    const uidToIndex = new Map([
      ["a", 0],
      ["b", 1],
    ]);
    const conditions: SubPatternTriggerCondition[] = [
      {
        mode: "base_match_total",
        operator: "gte",
        threshold: 1,
        rules: [{ uids: ["a", "missing"], mode: "raw" }],
      },
      {
        mode: "required",
        count: 1,
        uids: ["b"],
      },
    ];

    const compiled = compileSubPatternTriggerConditions(uidToIndex, conditions);

    expect(compiled).toEqual([
      {
        mode: "base_match_total",
        operator: "gte",
        threshold: 1,
        rules: [{ mode: "raw", indices: [0] }],
      },
      {
        mode: "required",
        count: 1,
        uids: ["b"],
        indices: [1],
      },
    ]);
  });
});
