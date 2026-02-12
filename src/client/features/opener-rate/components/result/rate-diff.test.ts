import { describe, expect, it } from "vitest";

import {
  rateBadgeClassName,
  resolvePatternRateBadgeClassName,
  resolveRateDiff,
} from "./rate-diff";

describe("resolveRateDiff", () => {
  it("差分が閾値未満なら null を返す", () => {
    expect(resolveRateDiff("10.000", "10.003")).toBeNull();
  });

  it("増加時はプラス表示を返す", () => {
    expect(resolveRateDiff("10.55", "10.11")).toEqual({
      className: "text-ui-green",
      text: "+0.44%",
    });
  });

  it("減少時はマイナス表示を返す", () => {
    expect(resolveRateDiff("9.50", "10.00")).toEqual({
      className: "text-ui-red",
      text: "-0.50%",
    });
  });

  it("現在値が数値でない場合は null を返す", () => {
    expect(resolveRateDiff("not-a-number", "10.00")).toBeNull();
  });
});

describe("resolvePatternRateBadgeClassName", () => {
  it("合計対象なら既定クラスを返す", () => {
    expect(resolvePatternRateBadgeClassName(false)).toBe(rateBadgeClassName);
  });

  it("合計除外なら黄色系クラスを返す", () => {
    const className = resolvePatternRateBadgeClassName(true);
    expect(className).toContain(rateBadgeClassName);
    expect(className).toContain("border-ui-yellow/60");
    expect(className).toContain("bg-ui-yellow/16");
    expect(className).toContain("text-ui-yellow");
  });
});
