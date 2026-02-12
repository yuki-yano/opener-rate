import { describe, expect, it } from "vitest";

import { resolveRateDiff } from "./rate-diff";

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
