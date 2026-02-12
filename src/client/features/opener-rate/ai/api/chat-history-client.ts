import {
  apiErrorResponseSchema,
  chatHistoryResponseSchema,
  chatHistorySaveResponseSchema,
  type ChatMessage,
} from "../../../../../shared/apiSchemas";

const readErrorMessage = async (response: Response) => {
  const fallback = `HTTP ${response.status}`;
  try {
    const json = await response.json();
    const parsed = apiErrorResponseSchema.safeParse(json);
    if (!parsed.success) return fallback;
    return parsed.data.error;
  } catch {
    return fallback;
  }
};

export const saveChatHistory = async (messages: ChatMessage[]) => {
  const response = await fetch("/api/chat/history", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const json = await response.json();
  const parsed = chatHistorySaveResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("履歴保存レスポンスの形式が不正です");
  }
  return parsed.data.key;
};

export const restoreChatHistory = async (historyKey: string) => {
  const response = await fetch(`/api/chat/history/${historyKey}`);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const json = await response.json();
  const parsed = chatHistoryResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("履歴復元レスポンスの形式が不正です");
  }
  return parsed.data.messages;
};
