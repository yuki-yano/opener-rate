import manifest from "__STATIC_CONTENT_MANIFEST" assert { type: "json" };
import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";

import routes from "./routes";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

app.route("/", routes);

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

export type { AppType } from "./routes";
export default app;
