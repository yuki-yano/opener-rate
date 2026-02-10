import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { shortenUrlRequestSchema } from "../../src/shared/apiSchemas";
import {
  createShortUrl,
  resolveShortUrlTarget,
} from "../services/short-link-service";
import type { AppEnv } from "../types";

const app = new Hono<AppEnv>();
const BASE_SHARE_TITLE = "Opener Rate 初動率シミュレーター";

const decodeNestedURIComponent = (value: string) => {
  let current = value;
  for (let i = 0; i < 3; i += 1) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }
  return current;
};

const extractDeckName = (raw: string | null | undefined) => {
  if (raw == null || raw.length === 0) return null;
  const decoded = decodeNestedURIComponent(raw);
  const trimmed = decoded.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const buildShareTitle = (deckName: string | null) =>
  deckName == null ? BASE_SHARE_TITLE : `${BASE_SHARE_TITLE} - ${deckName}`;

const buildRedirectHtml = (targetUrl: string, deckName: string | null) => {
  const shareTitle = buildShareTitle(deckName);
  const escapedTarget = escapeHtml(targetUrl);
  const escapedTitle = escapeHtml(shareTitle);

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>リダイレクト中…</title>
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="ja_JP" />
    <meta property="og:url" content="${escapedTarget}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapedTitle}" />
    <meta name="twitter:url" content="${escapedTarget}" />
    <meta http-equiv="refresh" content="0;url=${escapedTarget}" />
    <link rel="canonical" href="${escapedTarget}" />
    <script>
      window.location.replace(${JSON.stringify(targetUrl)});
    </script>
  </head>
  <body>
    <p>リダイレクト中です…</p>
  </body>
</html>`;
};

export const createShortUrlRoute = app.post(
  "/api/shorten_url/create",
  zValidator("json", shortenUrlRequestSchema),
  async (c) => {
    const { url } = c.req.valid("json");
    const requestOrigin = new URL(c.req.url).origin;
    const response = await createShortUrl({
      bindings: c.env,
      url,
      requestOrigin,
    });

    return c.json({
      shortenUrl: response.shortenUrl,
    });
  },
);

export const resolveShortUrlRoute = app.get(
  "/short_url/:key{[0-9a-z]{8}}",
  async (c) => {
    const key = c.req.param("key");
    const requestOrigin = new URL(c.req.url).origin;
    const fallbackTargetUrl = new URL("/", requestOrigin).toString();
    const targetUrl = await resolveShortUrlTarget({
      bindings: c.env,
      key,
    });

    if (targetUrl == null) {
      return c.html(buildRedirectHtml(fallbackTargetUrl, null));
    }

    try {
      const parsedTargetUrl = new URL(targetUrl, requestOrigin);
      const deckName = extractDeckName(parsedTargetUrl.searchParams.get("deckName"));
      return c.html(buildRedirectHtml(parsedTargetUrl.toString(), deckName));
    } catch {
      return c.html(buildRedirectHtml(fallbackTargetUrl, null));
    }
  },
);

export const shortLinkRoutes = app;
