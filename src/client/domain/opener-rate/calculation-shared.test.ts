import { describe, expect, it } from "vitest";

import {
  evaluateTrialOutcome,
  toRateStringFromBigInt,
  toRateStringFromNumber,
} from "./calculation-shared";
import type { CompiledPattern, CompiledSubPattern } from "./types";

describe("calculation-shared", () => {
  it("rounds number rates with toFixed(2)", () => {
    expect(toRateStringFromNumber(1, 6)).toBe("16.67");
  });

  it("truncates bigint rates at 2 decimals", () => {
    expect(toRateStringFromBigInt(1n, 6n)).toBe("16.66");
  });

  it("returns 0.00 when total is zero", () => {
    expect(toRateStringFromNumber(1, 0)).toBe("0.00");
    expect(toRateStringFromBigInt(1n, 0n)).toBe("0.00");
  });

  it("evaluates trial outcome with countable labels and success", () => {
    const compiledPattern: CompiledPattern = {
      uid: "pattern-1",
      name: "pattern-1",
      active: true,
      excludeFromOverall: false,
      conditions: [{ mode: "required", count: 1, uids: ["card-1"], indices: [0] }],
      labels: [{ uid: "label-1" }],
      effects: [],
      memo: "",
    };
    const compiledSubPattern: CompiledSubPattern = {
      uid: "sub-1",
      name: "sub-1",
      active: true,
      basePatternUids: ["pattern-1"],
      triggerConditions: [],
      triggerSourceIndices: [],
      applyLimit: "once_per_trial",
      effects: [{ type: "add_label", labelUids: ["label-2"] }],
      memo: "",
    };

    const outcome = evaluateTrialOutcome({
      compiledPatterns: [compiledPattern],
      compiledPatternByUid: new Map([["pattern-1", compiledPattern]]),
      compiledSubPatterns: [compiledSubPattern],
      handCounts: [1],
      deckCounts: [0],
    });

    expect(outcome.baseSuccess).toBe(true);
    expect(outcome.evaluation.matchedPatternUids).toEqual(["pattern-1"]);
    expect(outcome.matchedLabelUids).toEqual(new Set(["label-1", "label-2"]));
    expect(outcome.countableMatchedLabelUids).toEqual(
      new Set(["label-1", "label-2"]),
    );
  });

  it("does not count excluded pattern for overall success", () => {
    const excludedPattern: CompiledPattern = {
      uid: "pattern-1",
      name: "pattern-1",
      active: true,
      excludeFromOverall: true,
      conditions: [{ mode: "required", count: 1, uids: ["card-1"], indices: [0] }],
      labels: [{ uid: "label-1" }],
      effects: [],
      memo: "",
    };

    const outcome = evaluateTrialOutcome({
      compiledPatterns: [excludedPattern],
      compiledPatternByUid: new Map([["pattern-1", excludedPattern]]),
      compiledSubPatterns: [],
      handCounts: [1],
      deckCounts: [0],
    });

    expect(outcome.baseSuccess).toBe(false);
    expect(outcome.countablePatternEffects.countableMatchedPatternUids).toEqual([]);
    expect(outcome.countableMatchedLabelUids).toEqual(new Set());
  });
});
