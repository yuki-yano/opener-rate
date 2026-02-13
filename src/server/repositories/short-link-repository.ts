import { eq } from "drizzle-orm";

import { getDb } from "../db/client";
import { shortLinks } from "../db/schema";

type DbClient = ReturnType<typeof getDb>;

type CreateShortLinkInput = {
  deckName: string | null;
  key: string;
  targetUrl: string;
  now: number;
};

export const shortLinkRepository = {
  async create(db: DbClient, input: CreateShortLinkInput): Promise<void> {
    await db.insert(shortLinks).values({
      key: input.key,
      targetUrl: input.targetUrl,
      deckName: input.deckName,
      createdAt: input.now,
      updatedAt: input.now,
    });
  },

  async findTargetUrlByKey(
    db: DbClient,
    key: string,
  ): Promise<{ targetUrl: string; deckName: string | null } | null> {
    const rows = await db
      .select({
        targetUrl: shortLinks.targetUrl,
        deckName: shortLinks.deckName,
      })
      .from(shortLinks)
      .where(eq(shortLinks.key, key))
      .limit(1);
    if (rows.length === 0) return null;
    const first = rows[0];
    if (first == null) return null;
    return {
      targetUrl: first.targetUrl,
      deckName: first.deckName,
    };
  },
};
