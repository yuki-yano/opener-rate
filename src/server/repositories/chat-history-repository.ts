import { eq } from "drizzle-orm";

import { getDb } from "../db/client";
import { chatHistories } from "../db/schema";

type DbClient = ReturnType<typeof getDb>;

type CreateChatHistoryInput = {
  key: string;
  messagesJson: string;
  now: number;
};

export const chatHistoryRepository = {
  async create(db: DbClient, input: CreateChatHistoryInput): Promise<void> {
    await db.insert(chatHistories).values({
      key: input.key,
      messagesJson: input.messagesJson,
      createdAt: input.now,
      updatedAt: input.now,
    });
  },

  async findMessagesJsonByKey(
    db: DbClient,
    key: string,
  ): Promise<string | null> {
    const rows = await db
      .select({ messagesJson: chatHistories.messagesJson })
      .from(chatHistories)
      .where(eq(chatHistories.key, key))
      .limit(1);
    if (rows.length === 0) return null;
    return rows[0]?.messagesJson ?? null;
  },
};
