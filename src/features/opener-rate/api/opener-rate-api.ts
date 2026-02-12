import type {
  CalculateInput,
  CalculateOutput,
  ShortenUrlResponse,
} from "../../../shared/apiSchemas";

import type { CalculateClient } from "./calculate-client";
import { localCalculateClient } from "./calculate-client";
import { rpcShortUrlClient, type ShortUrlClient } from "./short-url-client";

export type OpenerRateApi = {
  calculate(input: CalculateInput): Promise<CalculateOutput>;
  createShortUrl(url: string): Promise<ShortenUrlResponse>;
};

export const createOpenerRateApi = (params?: {
  calculateClient?: CalculateClient;
  shortUrlClient?: ShortUrlClient;
}): OpenerRateApi => {
  const calculateClient = params?.calculateClient ?? localCalculateClient;
  const shortUrlClient = params?.shortUrlClient ?? rpcShortUrlClient;
  return {
    calculate: (input: CalculateInput) => calculateClient.calculate(input),
    createShortUrl: (url: string) => shortUrlClient.createShortUrl(url),
  };
};

export const openerRateApi = createOpenerRateApi();
