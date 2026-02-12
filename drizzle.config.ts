import { defineConfig } from "drizzle-kit";

const localD1Path =
  process.env.D1_LOCAL_SQLITE ??
  ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/local.sqlite";

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: localD1Path,
  },
});
