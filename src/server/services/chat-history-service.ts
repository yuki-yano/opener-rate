import { HTTPException } from "hono/http-exception";

import type { ChatMessage } from "../../shared/apiSchemas";
import { getDb } from "../db/client";
import { chatHistoryRepository } from "../repositories/chat-history-repository";
import type { Bindings } from "../types";

const KEY_LENGTH = 8;
const MAX_KEY_ATTEMPTS = 10;

const createCandidateKey = () =>
  crypto.randomUUID().replace(/-/g, "").slice(0, KEY_LENGTH);

const isUniqueConstraintError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("unique") ||
    message.includes("constraint") ||
    message.includes("primary key")
  );
};

export const createChatHistory = async (params: {
  bindings: Bindings;
  messages: ChatMessage[];
}) => {
  const db = getDb(params.bindings.DB);
  const now = Date.now();
  const messagesJson = JSON.stringify(params.messages);
  let key: string | null = null;

  for (let i = 0; i < MAX_KEY_ATTEMPTS; i += 1) {
    const candidate = createCandidateKey();
    try {
      await chatHistoryRepository.create(db, {
        key: candidate,
        messagesJson,
        now,
      });
      key = candidate;
      break;
    } catch (error) {
      if (isUniqueConstraintError(error)) continue;
      throw error;
    }
  }

  if (key == null) {
    throw new HTTPException(500, {
      message: "Failed to generate chat history key",
    });
  }

  return key;
};

export const getChatHistoryByKey = async (params: {
  bindings: Bindings;
  key: string;
}) => {
  const db = getDb(params.bindings.DB);
  return await chatHistoryRepository.findMessagesJsonByKey(db, params.key);
};
