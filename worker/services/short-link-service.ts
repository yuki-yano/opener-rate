import { HTTPException } from "hono/http-exception";

import { getDb } from "../db/client";
import { shortLinkRepository } from "../repositories/short-link-repository";
import type { Bindings } from "../types";

const KEY_LENGTH = 8;
const MAX_KEY_ATTEMPTS = 10;

const createCandidateKey = () =>
  crypto.randomUUID().replace(/-/g, "").slice(0, KEY_LENGTH);

const createUniqueKey = async (bindings: Bindings): Promise<string | null> => {
  const db = getDb(bindings.DB);

  for (let i = 0; i < MAX_KEY_ATTEMPTS; i += 1) {
    const key = createCandidateKey();
    const exists = await shortLinkRepository.existsByKey(db, key);
    if (!exists) return key;
  }

  return null;
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
  requestOrigin: string;
  runtimeOrigin?: string;
}) => {
  const key = await createUniqueKey(params.bindings);
  if (!key) {
    throw new HTTPException(500, { message: "Failed to generate short key" });
  }

  const db = getDb(params.bindings.DB);
  const now = Date.now();
  await shortLinkRepository.create(db, {
    key,
    now,
    targetUrl: params.url,
  });

  const localOriginForDetection = params.runtimeOrigin ?? params.requestOrigin;
  const origin = isLocalRequestOrigin(localOriginForDetection)
    ? params.requestOrigin
    : resolveOrigin(params.bindings, params.requestOrigin);
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
