import manifest from "__STATIC_CONTENT_MANIFEST" assert { type: "json" };
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";

import { shortenUrlRequestSchema } from "../src/shared/apiSchemas";
import { getDb } from "./db/client";
import { shortLinks } from "./db/schema";

type Bindings = {
  APP_ORIGIN?: string;
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

const KEY_LENGTH = 8;

const createCandidateKey = () =>
  crypto.randomUUID().replace(/-/g, "").slice(0, KEY_LENGTH);

const createUniqueKey = async (db: ReturnType<typeof getDb>) => {
  for (let i = 0; i < 10; i += 1) {
    const key = createCandidateKey();
    const existing = await db
      .select({ key: shortLinks.key })
      .from(shortLinks)
      .where(eq(shortLinks.key, key))
      .limit(1);
    if (existing.length === 0) {
      return key;
    }
  }
  return null;
};

app.get("/health", (c) => c.json({ ok: true }));

app.post(
  "/api/shorten_url/create",
  zValidator("json", shortenUrlRequestSchema),
  async (c) => {
    const { url } = c.req.valid("json");
    const db = getDb(c.env.DB);
    const key = await createUniqueKey(db);

    if (!key) {
      return c.json({ error: "Failed to generate short key" }, 500);
    }

    const now = Date.now();
    await db.insert(shortLinks).values({
      key,
      targetUrl: url,
      createdAt: now,
      updatedAt: now,
    });

    const origin = c.env.APP_ORIGIN?.trim() || new URL(c.req.url).origin;
    return c.json({
      shortenUrl: `${origin}/short_url/${key}`,
    });
  },
);

app.get("/short_url/:key{[0-9a-z]{8}}", async (c) => {
  const key = c.req.param("key");
  const db = getDb(c.env.DB);
  const row = await db
    .select({
      targetUrl: shortLinks.targetUrl,
    })
    .from(shortLinks)
    .where(eq(shortLinks.key, key))
    .limit(1);

  if (row.length === 0) {
    return c.redirect("/", 302);
  }

  return c.redirect(row[0]?.targetUrl ?? "/", 302);
});

app.get(
  "*",
  serveStatic({
    root: "./",
    manifest,
    rewriteRequestPath: (path) => {
      if (path.startsWith("/api/")) return path;
      if (path === "/" || !path.includes(".")) return "/index.html";
      return path;
    },
  }),
);

export default app;
