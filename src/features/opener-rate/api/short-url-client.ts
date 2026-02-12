import {
  shortenUrlResponseSchema,
  type ShortenUrlResponse,
} from "../../../shared/apiSchemas";
import type { ZodType } from "zod";

import { ApiClientError } from "./errors";
import { rpcClient } from "./rpc-client";

type RpcShortUrlClient = typeof rpcClient;

export type ShortUrlClient = {
  createShortUrl(url: string): Promise<ShortenUrlResponse>;
};

const readErrorMessage = async (response: Response) => {
  const fallback = `リクエストに失敗しました (HTTP ${response.status})`;
  try {
    const json = await response.json();
    if (typeof json !== "object" || json == null) return fallback;
    if (!("error" in json)) return fallback;
    const error = json.error;
    if (typeof error !== "string" || error.length === 0) return fallback;
    return error;
  } catch {
    return fallback;
  }
};

const ensureOk = async (response: Response) => {
  if (response.ok) return;
  throw new ApiClientError({
    code: "http_error",
    status: response.status,
    message: await readErrorMessage(response),
  });
};

const parseWith = <T>(schema: ZodType<T>, value: unknown): T => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const path =
      firstIssue == null || firstIssue.path.length === 0
        ? "root"
        : firstIssue.path.join(".");
    throw new ApiClientError({
      code: "invalid_response_schema",
      message: `APIレスポンス形式が不正です (${path}: ${firstIssue?.message ?? "invalid"})`,
    });
  }
  return parsed.data;
};

export const createRpcShortUrlClient = (
  client: RpcShortUrlClient = rpcClient,
): ShortUrlClient => ({
  async createShortUrl(url: string): Promise<ShortenUrlResponse> {
    try {
      const response = await client.api.shorten_url.create.$post({
        json: { url },
      });
      await ensureOk(response);
      return parseWith(shortenUrlResponseSchema, await response.json());
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError({
        code: "network_error",
        message: "通信エラーが発生しました",
        cause: error,
      });
    }
  },
});

export const rpcShortUrlClient = createRpcShortUrlClient();
