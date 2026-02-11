import { describe, expect, it } from "vitest";

import type { ComposeSource } from "./pattern-compose";
import {
  buildComposedSubPattern,
  resolveComposeEntries,
} from "./pattern-compose";

const createSource = (
  overrides: Partial<ComposeSource> = {},
): ComposeSource => ({
  value: "pattern:p1",
  label: "メイン: P1",
  conditions: [{ mode: "required", count: 1, uids: ["card-a"] }],
  basePatternUids: ["p1"],
  triggerSourceUids: [],
  effects: [],
  ...overrides,
});

describe("resolveComposeEntries", () => {
  it("sums penetration from both sources and drops zero categories", () => {
    const mainSource = createSource({
      effects: [
        {
          type: "add_penetration",
          disruptionCategoryUids: ["negate", "lock"],
          amount: 2,
        },
      ],
    });
    const filterSource = createSource({
      value: "sub_pattern:sp1",
      label: "サブ: SP1",
      effects: [
        {
          type: "add_penetration",
          disruptionCategoryUids: ["negate"],
          amount: 1,
        },
      ],
    });

    const entries = resolveComposeEntries(mainSource, filterSource, [
      "negate",
      "lock",
      "none",
      "negate",
    ]);

    expect(entries).toEqual([
      { disruptionCategoryUid: "negate", totalAmount: 3 },
      { disruptionCategoryUid: "lock", totalAmount: 2 },
    ]);
  });
});

describe("buildComposedSubPattern", () => {
  it("builds sub pattern with main as base and filter as trigger", () => {
    const mainSource = createSource({
      value: "pattern:p-main",
      label: "メイン: 初動A/B",
      conditions: [{ mode: "required", count: 1, uids: ["starter"] }],
      basePatternUids: ["p-main"],
      effects: [
        {
          type: "add_penetration",
          disruptionCategoryUids: ["cat-negate"],
          amount: 2,
        },
      ],
    });
    const filterSource = createSource({
      value: "sub_pattern:sp-filter",
      label: "サブ: ヨクル1枚",
      conditions: [
        {
          mode: "draw_total",
          operator: "eq",
          threshold: 1,
          rules: [{ mode: "raw", uids: ["yokuru"] }],
        },
      ],
      basePatternUids: ["p-other"],
      triggerSourceUids: ["yokuru"],
      effects: [
        {
          type: "add_penetration",
          disruptionCategoryUids: ["cat-negate"],
          amount: 1,
        },
      ],
    });

    const result = buildComposedSubPattern({
      uid: "sp-composed",
      name: "  メイン+フィルタ  ",
      mainSource,
      filterSource,
      selectedCategoryUids: ["cat-negate"],
      selectedLabelUids: ["label-1", "label-1"],
    });

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      uid: "sp-composed",
      name: "メイン+フィルタ",
      active: true,
      basePatternUids: ["p-main"],
      triggerSourceUids: ["yokuru"],
      applyLimit: "once_per_trial",
      memo: "合成元(メイン): メイン: 初動A/B / 合成元(フィルタ): サブ: ヨクル1枚",
    });
    expect(result?.triggerConditions).toEqual(filterSource.conditions);
    expect(result?.effects).toEqual([
      { type: "add_label", labelUids: ["label-1"] },
      {
        type: "add_penetration",
        disruptionCategoryUids: ["cat-negate"],
        amount: 3,
      },
    ]);
  });

  it("returns null when composed result has no penetration entry", () => {
    const mainSource = createSource({
      basePatternUids: ["p-main"],
    });
    const filterSource = createSource({
      value: "sub_pattern:sp-filter",
      label: "サブ: 条件のみ",
      conditions: [{ mode: "required", count: 1, uids: ["card-b"] }],
    });

    const result = buildComposedSubPattern({
      uid: "sp-composed",
      name: "合成",
      mainSource,
      filterSource,
      selectedCategoryUids: ["cat-negate"],
      selectedLabelUids: [],
    });

    expect(result).toBeNull();
  });
});
