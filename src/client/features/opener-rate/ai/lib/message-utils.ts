import type { UIMessage } from "ai";

import type { ChatMessage } from "../../../../../shared/apiSchemas";
import { CHAT_STATE_MARKER } from "../const";

const collectTextParts = (message: UIMessage) => {
  return message.parts
    .filter(
      (
        part,
      ): part is Extract<(typeof message.parts)[number], { type: "text" }> =>
        part.type === "text",
    )
    .map((part) => part.text)
    .join("");
};

export const toChatMessage = (message: UIMessage): ChatMessage => ({
  role: message.role,
  content: collectTextParts(message),
});

export const toChatMessages = (messages: UIMessage[]): ChatMessage[] =>
  messages.map(toChatMessage);

export const toUIMessage = (
  message: ChatMessage,
  id = crypto.randomUUID(),
): UIMessage => ({
  id,
  role: message.role,
  parts: [
    {
      type: "text",
      text: message.content,
    },
  ],
});

export const toUIMessages = (messages: ChatMessage[]): UIMessage[] =>
  messages.map((message) => toUIMessage(message));

export const stripStateBlockFromUserContent = (content: string) => {
  const markerIndex = content.indexOf(CHAT_STATE_MARKER);
  if (markerIndex < 0) return content;
  return content.slice(0, markerIndex).trimEnd();
};

export const extractLastAssistantText = (messages: UIMessage[]) => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.role !== "assistant") continue;
    return collectTextParts(message);
  }
  return null;
};

const jsonCodeBlockRegex = /```json\s*([\s\S]*?)\s*```/g;

export const extractJsonBlock = (text: string): string | null => {
  const matches = [...text.matchAll(jsonCodeBlockRegex)];
  if (matches.length > 0) {
    const latest = matches[matches.length - 1]?.[1]?.trim();
    if (latest != null && latest.length > 0) {
      try {
        JSON.parse(latest);
        return latest;
      } catch {
        return null;
      }
    }
  }

  const trimmed = text.trim();
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return null;
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    return null;
  }
};
