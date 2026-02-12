import { describe, expect, it } from "vitest";

import {
  createDefaultEffect,
  createDefaultPenetrationEffect,
  pruneUnavailablePenetrationCategories,
  switchEffectType,
} from "./effect-utils";

describe("effect-utils", () => {
  it("createDefaultEffect はラベル付与の初期値を返す", () => {
    expect(createDefaultEffect()).toEqual({
      type: "add_label",
      labelUids: [],
    });
  });

  it("createDefaultPenetrationEffect は貫通加算の初期値を返す", () => {
    expect(createDefaultPenetrationEffect()).toEqual({
      type: "add_penetration",
      disruptionCategoryUids: [],
      amount: 1,
    });
  });

  it("switchEffectType は種別を切り替える", () => {
    const switched = switchEffectType(createDefaultEffect(), "add_penetration");
    expect(switched).toEqual({
      type: "add_penetration",
      disruptionCategoryUids: [],
      amount: 1,
    });
  });

  it("pruneUnavailablePenetrationCategories は存在しないカテゴリUIDを除去する", () => {
    const { effects, changed } = pruneUnavailablePenetrationCategories(
      [
        {
          type: "add_penetration",
          disruptionCategoryUids: ["a", "b", "c"],
          amount: 2,
        },
        {
          type: "add_label",
          labelUids: ["label-1"],
        },
      ],
      new Set(["b", "c"]),
    );
    expect(changed).toBe(true);
    expect(effects).toEqual([
      {
        type: "add_penetration",
        disruptionCategoryUids: ["b", "c"],
        amount: 2,
      },
      {
        type: "add_label",
        labelUids: ["label-1"],
      },
    ]);
  });
});
