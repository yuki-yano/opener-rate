import { hc } from "hono/client";

import type { AppType } from "../../../../worker/routes";

const resolveBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://127.0.0.1:8787";
};

export const createRpcClient = (baseUrl = resolveBaseUrl()) =>
  hc<AppType>(baseUrl);

export const rpcClient = createRpcClient();
