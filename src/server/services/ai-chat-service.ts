import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, type ModelMessage } from "ai";
import { HTTPException } from "hono/http-exception";

import type { ThinkingLevel } from "../../shared/apiSchemas";
import type { Bindings } from "../types";

const DEFAULT_MODEL = "gemini-2.5-flash-lite";
const DEFAULT_THINKING_LEVEL: ThinkingLevel = "low";

export const streamChatResponse = async (params: {
  bindings: Bindings;
  messages: ModelMessage[];
  thinkingLevel?: ThinkingLevel;
}) => {
  const { bindings, messages } = params;
  const baseURL = bindings.GOOGLE_AI_GATEWAY_URL;
  const apiKey = bindings.GEMINI_API_KEY;
  if (baseURL == null || baseURL.trim().length === 0) {
    throw new HTTPException(500, {
      message: "GOOGLE_AI_GATEWAY_URL is not set.",
    });
  }
  if (apiKey == null || apiKey.trim().length === 0) {
    throw new HTTPException(500, {
      message: "GEMINI_API_KEY is not set.",
    });
  }

  const configuredModel = bindings.GEMINI_MODEL?.trim();
  const modelName =
    configuredModel == null || configuredModel.length === 0
      ? DEFAULT_MODEL
      : configuredModel;
  const client = createGoogleGenerativeAI({
    apiKey,
    baseURL,
  });
  const model = client(modelName);
  const thinkingLevel = params.thinkingLevel ?? DEFAULT_THINKING_LEVEL;
  const result = streamText({
    model,
    messages,
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingLevel,
        },
      },
    },
  });

  return result.toUIMessageStreamResponse();
};
