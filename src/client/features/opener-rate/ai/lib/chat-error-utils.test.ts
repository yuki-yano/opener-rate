import { describe, expect, it } from "vitest";

import { parseChatErrorMessage } from "./chat-error-utils";

describe("parseChatErrorMessage", () => {
  it("returns null when error is undefined", () => {
    expect(parseChatErrorMessage(undefined)).toBeNull();
  });

  it("returns fallback message when error message is blank", () => {
    expect(parseChatErrorMessage(new Error("   "))).toBe(
      "チャットエラーが発生しました",
    );
  });

  it("returns nested error field when message is JSON object with error", () => {
    expect(parseChatErrorMessage(new Error('{"error":"失敗しました"}'))).toBe(
      "失敗しました",
    );
  });

  it("returns original message when JSON has no error field", () => {
    expect(parseChatErrorMessage(new Error('{"message":"x"}'))).toBe(
      '{"message":"x"}',
    );
  });

  it("returns original text when message is not JSON", () => {
    expect(parseChatErrorMessage(new Error("network down"))).toBe("network down");
  });
});
