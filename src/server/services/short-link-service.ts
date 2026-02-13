import { HTTPException } from "hono/http-exception";

import { extractDeckNameFromTargetUrlString } from "../lib/deck-name";
import { getDb } from "../db/client";
import { shortLinkRepository } from "../repositories/short-link-repository";
import type { Bindings } from "../types";

const KEY_LENGTH = 8;
const MAX_KEY_ATTEMPTS = 10;

const createCandidateKey = () =>
  crypto.randomUUID().replace(/-/g, "").slice(0, KEY_LENGTH);

const isHttpProtocol = (protocol: string) =>
  protocol === "http:" || protocol === "https:";

const isUniqueConstraintError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("unique") ||
    message.includes("constraint") ||
    message.includes("primary key")
  );
};

const parseOrigin = (value: string) => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const ensureSafeShortenTargetUrl = (params: {
  url: string;
  trustedOrigin: string;
  bindings: Bindings;
}) => {
  let parsed: URL;
  try {
    parsed = new URL(params.url);
  } catch {
    throw new HTTPException(400, { message: "Invalid URL" });
  }
  if (!isHttpProtocol(parsed.protocol)) {
    throw new HTTPException(400, {
      message: "URL must use http or https",
    });
  }

  const trustedOrigin = parseOrigin(params.trustedOrigin);
  const configuredOrigin =
    params.bindings.APP_ORIGIN != null
      ? parseOrigin(params.bindings.APP_ORIGIN.trim())
      : null;
  if (trustedOrigin == null) {
    throw new HTTPException(400, { message: "Invalid trusted origin" });
  }

  const allowSameOrigin = parsed.origin === trustedOrigin;
  const allowConfiguredOrigin =
    configuredOrigin != null && parsed.origin === configuredOrigin;
  const allowLocalDevOrigin =
    isLocalRequestOrigin(trustedOrigin) && isLocalRequestOrigin(parsed.origin);
  if (!allowSameOrigin && !allowConfiguredOrigin && !allowLocalDevOrigin) {
    throw new HTTPException(400, {
      message: "URL origin is not allowed",
    });
  }

  return parsed.toString();
};

const isLocalRequestOrigin = (origin: string) => {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1"
    );
  } catch {
    return false;
  }
};

const resolveOrigin = (bindings: Bindings, requestOrigin: string) => {
  if (isLocalRequestOrigin(requestOrigin)) return requestOrigin;
  const configuredOrigin = bindings.APP_ORIGIN?.trim();
  if (configuredOrigin) return configuredOrigin;
  return requestOrigin;
};

export const createShortUrl = async (params: {
  bindings: Bindings;
  url: string;
  trustedOrigin: string;
  responseOrigin?: string;
  runtimeOrigin?: string;
}) => {
  const safeTargetUrl = ensureSafeShortenTargetUrl({
    url: params.url,
    trustedOrigin: params.trustedOrigin,
    bindings: params.bindings,
  });
  const deckName = extractDeckNameFromTargetUrlString(safeTargetUrl);
  const db = getDb(params.bindings.DB);
  const now = Date.now();
  let key: string | null = null;
  for (let i = 0; i < MAX_KEY_ATTEMPTS; i += 1) {
    const candidate = createCandidateKey();
    try {
      await shortLinkRepository.create(db, {
        deckName,
        key: candidate,
        now,
        targetUrl: safeTargetUrl,
      });
      key = candidate;
      break;
    } catch (error) {
      if (isUniqueConstraintError(error)) continue;
      throw error;
    }
  }
  if (key == null) {
    throw new HTTPException(500, { message: "Failed to generate short key" });
  }

  const localOriginForDetection = params.runtimeOrigin ?? params.trustedOrigin;
  const normalizedResponseOrigin =
    parseOrigin(params.responseOrigin ?? "") ?? params.trustedOrigin;
  const origin = isLocalRequestOrigin(localOriginForDetection)
    ? normalizedResponseOrigin
    : resolveOrigin(params.bindings, normalizedResponseOrigin);
  return {
    key,
    shortenUrl: `${origin}/short_url/${key}`,
  };
};

export const resolveShortUrlTarget = async (params: {
  bindings: Bindings;
  key: string;
}) => {
  const db = getDb(params.bindings.DB);
  return shortLinkRepository.findTargetUrlByKey(db, params.key);
};
