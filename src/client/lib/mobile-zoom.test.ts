import { describe, expect, it } from "vitest";

import { isIosLikeDevice, withMaximumScaleOne } from "./mobile-zoom";

describe("isIosLikeDevice", () => {
  it("returns true for iPhone user agent", () => {
    expect(
      isIosLikeDevice({
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15",
        platform: "iPhone",
        maxTouchPoints: 5,
      }),
    ).toBe(true);
  });

  it("returns true for iPadOS MacIntel touch device", () => {
    expect(
      isIosLikeDevice({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 5,
      }),
    ).toBe(true);
  });

  it("returns false for non-iOS device", () => {
    expect(
      isIosLikeDevice({
        userAgent:
          "Mozilla/5.0 (Linux; Android 15; Pixel) AppleWebKit/537.36 Chrome/132",
        platform: "Linux armv8l",
        maxTouchPoints: 5,
      }),
    ).toBe(false);
  });
});

describe("withMaximumScaleOne", () => {
  it("appends maximum-scale when missing", () => {
    expect(withMaximumScaleOne("width=device-width, initial-scale=1.0")).toBe(
      "width=device-width, initial-scale=1.0, maximum-scale=1",
    );
  });

  it("overwrites existing maximum-scale value", () => {
    expect(
      withMaximumScaleOne(
        "width=device-width, initial-scale=1.0, maximum-scale=5",
      ),
    ).toBe("width=device-width, initial-scale=1.0, maximum-scale=1");
  });

  it("returns maximum-scale only for empty content", () => {
    expect(withMaximumScaleOne("")).toBe("maximum-scale=1");
  });
});
