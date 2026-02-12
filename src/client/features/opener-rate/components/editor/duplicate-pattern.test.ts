import { describe, expect, it } from "vitest";

import type { Pattern, SubPattern } from "../../../../../shared/apiSchemas";
import {
  createDuplicatedPattern,
  createDuplicatedSubPattern,
} from "./duplicate-pattern";

describe("createDuplicatedPattern", () => {
  it("copies pattern with new uid/name and deep-cloned nested values", () => {
    const source: Pattern = {
      uid: "pattern-1",
      name: "先攻展開",
      active: false,
      excludeFromOverall: true,
      conditions: [
        {
          mode: "required",
          count: 2,
          uids: ["card-a", "card-b"],
        },
        {
          mode: "draw_total",
          operator: "gte",
          threshold: 2,
          rules: [{ mode: "cap1", uids: ["card-c"] }],
        },
      ],
      labels: [{ uid: "label-1" }],
      effects: [
        { type: "add_label", labelUids: ["label-1"] },
        {
          type: "add_penetration",
          disruptionCategoryUids: ["category-1"],
          amount: 2,
        },
      ],
      memo: "memo",
    };

    const duplicated = createDuplicatedPattern({
      source,
      nextUid: "pattern-2",
      fallbackName: "パターン1",
    });

    expect(duplicated.uid).toBe("pattern-2");
    expect(duplicated.name).toBe("先攻展開 - コピー");
    expect(duplicated.active).toBe(true);
    expect(duplicated.excludeFromOverall).toBe(true);

    const firstSourceCondition = source.conditions[0];
    if ("uids" in firstSourceCondition) {
      firstSourceCondition.uids[0] = "card-z";
    }
    source.labels[0].uid = "label-z";
    if (source.effects != null) {
      const firstEffect = source.effects[0];
      if ("labelUids" in firstEffect) {
        firstEffect.labelUids[0] = "label-z";
      }
      if (source.effects[1]?.type === "add_penetration") {
        source.effects[1].disruptionCategoryUids[0] = "category-z";
      }
    }

    const duplicatedFirstCondition = duplicated.conditions[0];
    if ("uids" in duplicatedFirstCondition) {
      expect(duplicatedFirstCondition.uids[0]).toBe("card-a");
    }
    expect(duplicated.labels[0].uid).toBe("label-1");
    if (duplicated.effects != null) {
      expect(duplicated.effects[0].type).toBe("add_label");
      if (duplicated.effects[0].type === "add_label") {
        expect(duplicated.effects[0].labelUids[0]).toBe("label-1");
      }
      expect(duplicated.effects[1].type).toBe("add_penetration");
      if (duplicated.effects[1].type === "add_penetration") {
        expect(duplicated.effects[1].disruptionCategoryUids[0]).toBe(
          "category-1",
        );
      }
    }
  });

  it("uses fallback name when source name is blank", () => {
    const source: Pattern = {
      uid: "pattern-1",
      name: "   ",
      active: true,
      excludeFromOverall: false,
      conditions: [],
      labels: [],
      effects: [],
      memo: "",
    };

    const duplicated = createDuplicatedPattern({
      source,
      nextUid: "pattern-2",
      fallbackName: "パターン1",
    });

    expect(duplicated.name).toBe("パターン1 - コピー");
  });
});

describe("createDuplicatedSubPattern", () => {
  it("copies sub pattern with new uid/name and deep-cloned nested values", () => {
    const source: SubPattern = {
      uid: "sub-1",
      name: "後続確保",
      active: false,
      basePatternUids: ["pattern-a"],
      triggerConditions: [
        {
          mode: "required",
          count: 1,
          uids: ["card-a"],
        },
      ],
      triggerSourceUids: ["card-a"],
      applyLimit: "once_per_distinct_uid",
      effects: [
        {
          type: "add_penetration",
          disruptionCategoryUids: ["category-1"],
          amount: 1,
        },
      ],
      memo: "memo",
    };

    const duplicated = createDuplicatedSubPattern({
      source,
      nextUid: "sub-2",
      fallbackName: "サブパターン1",
    });

    expect(duplicated.uid).toBe("sub-2");
    expect(duplicated.name).toBe("後続確保 - コピー");
    expect(duplicated.active).toBe(true);
    expect(duplicated.applyLimit).toBe("once_per_distinct_uid");

    source.basePatternUids[0] = "pattern-z";
    const firstTriggerCondition = source.triggerConditions[0];
    if ("uids" in firstTriggerCondition) {
      firstTriggerCondition.uids[0] = "card-z";
    }
    source.triggerSourceUids[0] = "card-z";
    if (source.effects[0]?.type === "add_penetration") {
      source.effects[0].disruptionCategoryUids[0] = "category-z";
    }

    expect(duplicated.basePatternUids[0]).toBe("pattern-a");
    const duplicatedFirstTriggerCondition = duplicated.triggerConditions[0];
    if ("uids" in duplicatedFirstTriggerCondition) {
      expect(duplicatedFirstTriggerCondition.uids[0]).toBe("card-a");
    }
    expect(duplicated.triggerSourceUids[0]).toBe("card-a");
    expect(duplicated.effects[0].type).toBe("add_penetration");
    if (duplicated.effects[0].type === "add_penetration") {
      expect(duplicated.effects[0].disruptionCategoryUids[0]).toBe(
        "category-1",
      );
    }
  });
});
