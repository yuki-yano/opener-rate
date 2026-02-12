import { describe, expect, it } from "vitest";

import {
  chatHistoryResponseSchema,
  chatHistorySaveRequestSchema,
  chatRequestSchema,
} from "./apiSchemas";

describe("chat api schemas", () => {
  it("accepts valid chat request payload", () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: "user", content: "hello" }],
      systemPrompt: "system prompt",
      thinkingLevel: "high",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid thinkingLevel", () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: "user", content: "hello" }],
      thinkingLevel: "unknown",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty chat history save payload", () => {
    const result = chatHistorySaveRequestSchema.safeParse({
      messages: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid chat history response payload", () => {
    const result = chatHistoryResponseSchema.safeParse({
      messages: [{ role: "assistant", content: { value: "invalid" } }],
    });

    expect(result.success).toBe(false);
  });
});
