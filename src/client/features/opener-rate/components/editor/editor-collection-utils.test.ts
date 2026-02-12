import { describe, expect, it } from "vitest";

import {
  createDefaultRequiredCondition,
  removeItemByUid,
  removeUid,
  toNamedOptions,
  toggleUid,
  updateItemByUid,
} from "./editor-collection-utils";

describe("editor-collection-utils", () => {
  it("creates default required condition", () => {
    expect(createDefaultRequiredCondition()).toEqual({
      mode: "required",
      count: 1,
      uids: [],
    });
  });

  it("maps named entities to options with non-empty names only", () => {
    expect(
      toNamedOptions([
        { uid: "a", name: "A" },
        { uid: "b", name: "  " },
      ]),
    ).toEqual([{ value: "a", label: "A" }]);
  });

  it("toggles uid in array", () => {
    expect(toggleUid(["x"], "x")).toEqual([]);
    expect(toggleUid(["x"], "y")).toEqual(["x", "y"]);
  });

  it("removes uid from array", () => {
    expect(removeUid(["x", "y"], "x")).toEqual(["y"]);
  });

  it("updates target item by uid", () => {
    expect(
      updateItemByUid(
        [
          { uid: "a", value: 1 },
          { uid: "b", value: 2 },
        ],
        "b",
        (item) => ({ ...item, value: item.value + 1 }),
      ),
    ).toEqual([
      { uid: "a", value: 1 },
      { uid: "b", value: 3 },
    ]);
  });

  it("removes target item by uid", () => {
    expect(
      removeItemByUid(
        [
          { uid: "a", value: 1 },
          { uid: "b", value: 2 },
        ],
        "a",
      ),
    ).toEqual([{ uid: "b", value: 2 }]);
  });
});
