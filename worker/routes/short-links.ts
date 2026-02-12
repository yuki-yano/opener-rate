import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { shortenUrlRequestSchema } from "../../src/shared/apiSchemas";
import {
  createShortUrl,
  resolveShortUrlTarget,
} from "../services/short-link-service";
import type { AppEnv } from "../types";

const app = new Hono<AppEnv>();
const BASE_SHARE_TITLE = "初動率シミュレーター";
const REDIRECT_SOURCE_SHORT_URL_KEY = "openerRate.redirectSourceShortUrl";
const isHttpProtocol = (protocol: string) =>
  protocol === "http:" || protocol === "https:";
const isLocalHostname = (hostname: string) =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "0.0.0.0" ||
  hostname === "::1";

const pickFirstHeaderValue = (raw: string | null) => {
  if (raw == null) return null;
  const [first] = raw.split(",");
  const trimmed = first?.trim();
  if (trimmed == null || trimmed.length === 0) return null;
  return trimmed;
};

const normalizeHostForLocal = (host: string, fallbackPort: string) => {
  const url = new URL(`http://${host}`);
  const hostname = url.hostname;
  if (hostname === "0.0.0.0" || hostname === "::") {
    const port = url.port.length > 0 ? url.port : fallbackPort;
    return port.length > 0 ? `127.0.0.1:${port}` : "127.0.0.1";
  }
  return host;
};

const resolveRequestOrigin = (request: Request) => {
  const parsed = new URL(request.url);
  const protocol =
    pickFirstHeaderValue(request.headers.get("x-forwarded-proto")) ??
    parsed.protocol.replace(":", "");
  const fromOriginHeader = pickFirstHeaderValue(request.headers.get("origin"));
  if (fromOriginHeader != null) {
    try {
      return new URL(fromOriginHeader).origin;
    } catch {
      // ignore invalid origin header and continue resolving from host headers
    }
  }

  const hostCandidates = [
    pickFirstHeaderValue(request.headers.get("host")),
    pickFirstHeaderValue(request.headers.get("x-forwarded-host")),
    parsed.host,
  ];

  for (const hostCandidate of hostCandidates) {
    if (hostCandidate == null) continue;
    try {
      const normalized = normalizeHostForLocal(hostCandidate, parsed.port);
      return `${protocol}://${normalized}`;
    } catch {
      continue;
    }
  }

  return parsed.origin;
};

const resolveSafeRedirectTarget = (params: {
  targetUrl: string;
  trustedOrigin: string;
  configuredOrigin?: string;
}) => {
  const trustedOrigin = new URL(params.trustedOrigin).origin;
  const parsedTarget = new URL(params.targetUrl);
  const configuredOrigin =
    params.configuredOrigin == null ||
    params.configuredOrigin.trim().length === 0
      ? null
      : new URL(params.configuredOrigin).origin;
  if (!isHttpProtocol(parsedTarget.protocol)) return null;
  if (parsedTarget.origin === trustedOrigin) return parsedTarget;
  if (configuredOrigin != null && parsedTarget.origin === configuredOrigin) {
    return parsedTarget;
  }
  if (
    isLocalHostname(parsedTarget.hostname) &&
    isLocalHostname(new URL(trustedOrigin).hostname)
  ) {
    return parsedTarget;
  }
  return null;
};

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

const buildRedirectHtml = (
  targetUrl: string,
  deckName: string | null,
  sourceShortUrl?: string,
) => {
  const shareTitle = buildShareTitle(deckName);
  const escapedTarget = escapeHtml(targetUrl);
  const escapedTitle = escapeHtml(shareTitle);
  const sourceShortUrlJson =
    sourceShortUrl == null ? "null" : JSON.stringify(sourceShortUrl);

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
    <link rel="canonical" href="${escapedTarget}" />
    <script>
      const sourceShortUrl = ${sourceShortUrlJson};
      if (typeof sourceShortUrl === "string" && sourceShortUrl.length > 0) {
        try {
          window.sessionStorage.setItem(
            ${JSON.stringify(REDIRECT_SOURCE_SHORT_URL_KEY)},
            sourceShortUrl,
          );
        } catch {
          // sessionStorage が無効な環境はそのまま遷移
        }
      }
      window.location.replace(${JSON.stringify(targetUrl)});
    </script>
    <meta http-equiv="refresh" content="0;url=${escapedTarget}" />
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
    const trustedOrigin = new URL(c.req.url).origin;
    const requestOrigin = resolveRequestOrigin(c.req.raw);
    const response = await createShortUrl({
      bindings: c.env,
      url,
      trustedOrigin,
      responseOrigin: requestOrigin,
      runtimeOrigin: trustedOrigin,
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
    const trustedOrigin = new URL(c.req.url).origin;
    const sourceShortUrl = new URL(
      `/short_url/${key}`,
      trustedOrigin,
    ).toString();
    const fallbackTargetUrl = new URL("/", trustedOrigin).toString();
    const targetUrl = await resolveShortUrlTarget({
      bindings: c.env,
      key,
    });

    if (targetUrl == null) {
      return c.html(buildRedirectHtml(fallbackTargetUrl, null));
    }

    try {
      const parsedTargetUrl = resolveSafeRedirectTarget({
        targetUrl,
        trustedOrigin,
        configuredOrigin: c.env.APP_ORIGIN,
      });
      if (parsedTargetUrl == null) {
        return c.html(buildRedirectHtml(fallbackTargetUrl, null));
      }
      const deckName = extractDeckName(
        parsedTargetUrl.searchParams.get("deckName"),
      );
      return c.html(
        buildRedirectHtml(parsedTargetUrl.toString(), deckName, sourceShortUrl),
      );
    } catch {
      return c.html(buildRedirectHtml(fallbackTargetUrl, null));
    }
  },
);

export const shortLinkRoutes = app;
