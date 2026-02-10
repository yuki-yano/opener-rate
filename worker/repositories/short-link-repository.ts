import { eq } from "drizzle-orm";

import { getDb } from "../db/client";
import { shortLinks } from "../db/schema";

type DbClient = ReturnType<typeof getDb>;

type CreateShortLinkInput = {
  key: string;
  targetUrl: string;
  now: number;
};

export const shortLinkRepository = {
  async existsByKey(db: DbClient, key: string): Promise<boolean> {
    const rows = await db
      .select({ key: shortLinks.key })
      .from(shortLinks)
      .where(eq(shortLinks.key, key))
      .limit(1);
    return rows.length > 0;
  },

  async create(db: DbClient, input: CreateShortLinkInput): Promise<void> {
    await db.insert(shortLinks).values({
      key: input.key,
      targetUrl: input.targetUrl,
      createdAt: input.now,
      updatedAt: input.now,
    });
  },

  async findTargetUrlByKey(db: DbClient, key: string): Promise<string | null> {
    const rows = await db
      .select({ targetUrl: shortLinks.targetUrl })
      .from(shortLinks)
      .where(eq(shortLinks.key, key))
      .limit(1);
    if (rows.length === 0) return null;
    return rows[0]?.targetUrl ?? null;
  },
};
