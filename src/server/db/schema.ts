import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const shortLinks = sqliteTable(
  "short_links",
  {
    key: text("key").primaryKey(),
    targetUrl: text("target_url").notNull(),
    createdAt: integer("created_at", { mode: "number" })
      .notNull()
      .default(sql`(strftime('%s','now') * 1000)`),
    updatedAt: integer("updated_at", { mode: "number" })
      .notNull()
      .default(sql`(strftime('%s','now') * 1000)`),
  },
  (table) => [index("idx_short_links_created_at").on(table.createdAt)],
);

export type ShortLink = typeof shortLinks.$inferSelect;
export type ShortLinkInsert = typeof shortLinks.$inferInsert;
