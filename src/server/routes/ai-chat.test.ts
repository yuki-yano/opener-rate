import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  createChatHistory: vi.fn(),
  getChatHistoryByKey: vi.fn(),
  streamChatResponse: vi.fn(),
}));

vi.mock("../services/ai-chat-service", () => ({
  streamChatResponse: serviceMocks.streamChatResponse,
}));

vi.mock("../services/chat-history-service", () => ({
  createChatHistory: serviceMocks.createChatHistory,
  getChatHistoryByKey: serviceMocks.getChatHistoryByKey,
}));

import { aiChatRoutes } from "./ai-chat";

const env = {
  DB: {} as D1Database,
} as const;

describe("aiChatRoutes", () => {
  beforeEach(() => {
    serviceMocks.streamChatResponse.mockReset();
    serviceMocks.createChatHistory.mockReset();
    serviceMocks.getChatHistoryByKey.mockReset();
  });

  it("rejects invalid chat request body", async () => {
    const response = await aiChatRoutes.request(
      "https://consistency-rate.pages.dev/api/chat",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: "invalid" }),
      },
      env,
    );

    expect(response.status).toBe(400);
    expect(serviceMocks.streamChatResponse).not.toHaveBeenCalled();
  });

  it("rejects chat request when user/assistant messages are empty", async () => {
    const response = await aiChatRoutes.request(
      "https://consistency-rate.pages.dev/api/chat",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "system", content: "sys" }],
          systemPrompt: "system prompt",
        }),
      },
      env,
    );

    expect(response.status).toBe(400);
    expect(serviceMocks.streamChatResponse).not.toHaveBeenCalled();
  });

  it("calls chat streaming service with processed messages", async () => {
    serviceMocks.streamChatResponse.mockResolvedValue(
      new Response("ok", { status: 200 }),
    );

    const response = await aiChatRoutes.request(
      "https://consistency-rate.pages.dev/api/chat",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "should be filtered out" },
            { role: "user", content: "hello" },
          ],
          systemPrompt: "system prompt",
          thinkingLevel: "high",
        }),
      },
      env,
    );

    expect(response.status).toBe(200);
    expect(serviceMocks.streamChatResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        bindings: env,
        messages: [
          { role: "system", content: "system prompt" },
          { role: "user", content: "hello" },
        ],
        thinkingLevel: "high",
      }),
    );
  });

  it("saves chat history and returns key", async () => {
    serviceMocks.createChatHistory.mockResolvedValue("abc123de");

    const response = await aiChatRoutes.request(
      "https://consistency-rate.pages.dev/api/chat/history",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "hello" }],
        }),
      },
      env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ key: "abc123de" });
    expect(serviceMocks.createChatHistory).toHaveBeenCalledWith({
      bindings: env,
      messages: [{ role: "user", content: "hello" }],
    });
  });

  it("returns 404 when chat history is not found", async () => {
    serviceMocks.getChatHistoryByKey.mockResolvedValue(null);

    const response = await aiChatRoutes.request(
      "https://consistency-rate.pages.dev/api/chat/history/abc123de",
      undefined,
      env,
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Chat history not found",
    });
  });

  it("returns 500 when stored chat history JSON is invalid", async () => {
    serviceMocks.getChatHistoryByKey.mockResolvedValue('[{"role":"user"}]');

    const response = await aiChatRoutes.request(
      "https://consistency-rate.pages.dev/api/chat/history/abc123de",
      undefined,
      env,
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid chat history format found",
    });
  });

  it("returns stored chat history when key exists", async () => {
    serviceMocks.getChatHistoryByKey.mockResolvedValue(
      JSON.stringify([
        { role: "user", content: "hello" },
        { role: "assistant", content: "world" },
      ]),
    );

    const response = await aiChatRoutes.request(
      "https://consistency-rate.pages.dev/api/chat/history/abc123de",
      undefined,
      env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      messages: [
        { role: "user", content: "hello" },
        { role: "assistant", content: "world" },
      ],
    });
  });
});
