import { z } from "zod";

export const chatRoleSchema = z.enum(["user", "assistant", "system"]);

export const chatMessageSchema = z.object({
  role: chatRoleSchema,
  content: z.string(),
});

export const chatHistoryMessagesSchema = z.array(chatMessageSchema);

export const thinkingLevelSchema = z.enum(["minimal", "low", "medium", "high"]);

export const chatRequestSchema = z.object({
  messages: chatHistoryMessagesSchema.default([]),
  systemPrompt: z.string().optional(),
  thinkingLevel: thinkingLevelSchema.optional(),
});

export const chatHistorySaveRequestSchema = z.object({
  messages: chatHistoryMessagesSchema.min(1),
});

export const chatHistorySaveResponseSchema = z.object({
  key: z.string().regex(/^[0-9a-z]{8}$/),
});

export const chatHistoryResponseSchema = z.object({
  messages: chatHistoryMessagesSchema,
});

export type ChatRole = z.infer<typeof chatRoleSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ThinkingLevel = z.infer<typeof thinkingLevelSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatHistorySaveRequest = z.infer<
  typeof chatHistorySaveRequestSchema
>;
export type ChatHistorySaveResponse = z.infer<
  typeof chatHistorySaveResponseSchema
>;
export type ChatHistoryResponse = z.infer<typeof chatHistoryResponseSchema>;
