import { describe, expect, it } from "vitest";

import {
  toRateStringFromBigInt,
  toRateStringFromNumber,
} from "./calculation-shared";

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
});
