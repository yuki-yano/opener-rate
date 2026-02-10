import {
  shortenUrlResponseSchema,
  type CalculateInput,
  type CalculateOutput,
  type ShortenUrlResponse,
} from "../../../shared/apiSchemas";
import type { ZodType } from "zod";
import { calculateOpenerRateDomain } from "../../../domain/opener-rate";
import { rpcClient } from "./rpc-client";

const readErrorMessage = async (response: Response) => {
  const fallback = `Request failed: ${response.status}`;
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
  throw new Error(await readErrorMessage(response));
};

const parseWith = <T>(schema: ZodType<T>, value: unknown): T => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error("Invalid API response schema");
  }
  return parsed.data;
};

export const openerRateApi = {
  async calculate(input: CalculateInput): Promise<CalculateOutput> {
    // 計算はブラウザ内で完結させる。
    return calculateOpenerRateDomain(input);
  },

  async createShortUrl(url: string): Promise<ShortenUrlResponse> {
    const response = await rpcClient.api.shorten_url.create.$post({
      json: { url },
    });
    await ensureOk(response);
    return parseWith(shortenUrlResponseSchema, await response.json());
  },
};
