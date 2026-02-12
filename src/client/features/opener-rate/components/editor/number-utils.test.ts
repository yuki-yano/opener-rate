import { describe, expect, it } from "vitest";

import { toInt } from "./number-utils";

describe("toInt", () => {
  it("整数文字列を数値へ変換する", () => {
    expect(toInt("42", 0)).toBe(42);
  });

  it("不正な文字列ではフォールバック値を返す", () => {
    expect(toInt("abc", 7)).toBe(7);
  });

  it("空文字ではフォールバック値を返す", () => {
    expect(toInt("", 3)).toBe(3);
  });
});
