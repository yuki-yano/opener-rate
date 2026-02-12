import { zValidator } from "@hono/zod-validator";
import type { ModelMessage } from "ai";
import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";

import {
  chatHistoryMessagesSchema,
  chatHistoryResponseSchema,
  chatHistorySaveRequestSchema,
  chatHistorySaveResponseSchema,
  chatRequestSchema,
} from "../../shared/apiSchemas";
import { streamChatResponse } from "../services/ai-chat-service";
import {
  createChatHistory,
  getChatHistoryByKey,
} from "../services/chat-history-service";
import type { AppEnv } from "../types";

const app = new Hono<AppEnv>();

const toErrorResponse = (
  c: Context<AppEnv>,
  error: unknown,
  fallbackMessage: string,
) => {
  if (error instanceof HTTPException) {
    return c.json({ error: error.message }, error.status);
  }
  const message = error instanceof Error ? error.message : fallbackMessage;
  return c.json({ error: message }, 500);
};

export const chatRoute = app.post(
  "/api/chat",
  zValidator("json", chatRequestSchema),
  async (c) => {
    try {
      const { messages, systemPrompt, thinkingLevel } = c.req.valid("json");
      const processedMessages: ModelMessage[] = messages
        .filter((message) => {
          return message.role === "user" || message.role === "assistant";
        })
        .map((message) => ({
          role: message.role,
          content: message.content,
        }));

      if (typeof systemPrompt === "string" && systemPrompt.trim().length > 0) {
        processedMessages.unshift({
          role: "system",
          content: systemPrompt,
        });
      }

      if (
        processedMessages.length === 0 ||
        (processedMessages.length === 1 &&
          processedMessages[0]?.role === "system")
      ) {
        return c.json({ error: "Invalid or empty messages format" }, 400);
      }

      return await streamChatResponse({
        bindings: c.env,
        messages: processedMessages,
        thinkingLevel,
      });
    } catch (error) {
      return toErrorResponse(c, error, "Failed to stream chat response");
    }
  },
);

export const createChatHistoryRoute = app.post(
  "/api/chat/history",
  zValidator("json", chatHistorySaveRequestSchema),
  async (c) => {
    try {
      const { messages } = c.req.valid("json");
      const key = await createChatHistory({
        bindings: c.env,
        messages,
      });
      return c.json(chatHistorySaveResponseSchema.parse({ key }));
    } catch (error) {
      return toErrorResponse(c, error, "Failed to save chat history");
    }
  },
);

export const getChatHistoryRoute = app.get(
  "/api/chat/history/:key{[0-9a-z]{8}}",
  async (c) => {
    try {
      const key = c.req.param("key");
      const messagesJson = await getChatHistoryByKey({
        bindings: c.env,
        key,
      });
      if (messagesJson == null) {
        return c.json({ error: "Chat history not found" }, 404);
      }

      const parsed = JSON.parse(messagesJson);
      const validated = chatHistoryMessagesSchema.safeParse(parsed);
      if (!validated.success) {
        return c.json({ error: "Invalid chat history format found" }, 500);
      }

      return c.json(
        chatHistoryResponseSchema.parse({
          messages: validated.data,
        }),
      );
    } catch (error) {
      if (error instanceof SyntaxError) {
        return c.json({ error: "Failed to parse chat history" }, 500);
      }
      return toErrorResponse(c, error, "Failed to retrieve chat history");
    }
  },
);

export const aiChatRoutes = app;
