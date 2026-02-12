import { atom } from "jotai";

import { openerRateApi } from "../../api/opener-rate-api";
import { ApiClientError } from "../../api/errors";
import type { CalculateInput } from "../../../../../shared/apiSchemas";
import { calculateInputAtom } from "../derived/atoms";
import {
  calculationResultAtom,
  isCalculatingAtom,
  previousCalculationResultAtom,
  savedInputAtom,
  shortUrlCacheAtom,
  shortUrlErrorAtom,
  shortUrlInputAtom,
  shortUrlLockedUntilChangeAtom,
  shortUrlLoadingAtom,
  shortUrlResultAtom,
  transportErrorAtom,
} from "../ui/atoms";

const toErrorMessage = (error: unknown) => {
  if (error instanceof ApiClientError) {
    if (error.code === "network_error") {
      return "通信エラーが発生しました。接続状況を確認してください";
    }
    if (error.code === "invalid_response_schema") {
      return "サーバー応答の形式が不正です。時間をおいて再試行してください";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "予期しない通信エラーが発生しました";
};

const isShortUrlPath = (url: string) => {
  try {
    const parsed = new URL(url);
    return /^\/short_url\/[0-9a-z]{8}\/?$/.test(parsed.pathname);
  } catch {
    return false;
  }
};

export const markSavedSnapshotAtom = atom(
  null,
  (get, set, snapshot?: CalculateInput) => {
    if (snapshot == null) {
      set(savedInputAtom, get(calculateInputAtom));
      return;
    }
    set(savedInputAtom, snapshot);
  },
);

export const clearCalculationStateAtom = atom(null, (_get, set) => {
  set(calculationResultAtom, null);
  set(previousCalculationResultAtom, null);
  set(transportErrorAtom, null);
  set(isCalculatingAtom, false);
});

export const runCalculateAtom = atom(null, async (get, set) => {
  const currentResult = get(calculationResultAtom);
  if (currentResult?.mode === "exact") {
    set(previousCalculationResultAtom, currentResult);
  }

  const input = get(calculateInputAtom);
  set(isCalculatingAtom, true);
  set(transportErrorAtom, null);

  try {
    const result = await openerRateApi.calculate(input);
    set(calculationResultAtom, result);
  } catch (error) {
    set(transportErrorAtom, toErrorMessage(error));
    set(calculationResultAtom, null);
  } finally {
    set(isCalculatingAtom, false);
  }
});

export const runCreateShortUrlAtom = atom(
  null,
  async (get, set, sourceUrl?: string) => {
    const url = (sourceUrl ?? get(shortUrlInputAtom)).trim();
    if (url.length === 0) {
      set(shortUrlErrorAtom, "URLを入力してください");
      return;
    }

    set(shortUrlLoadingAtom, true);
    set(shortUrlErrorAtom, null);
    set(shortUrlResultAtom, null);
    try {
      const response = await openerRateApi.createShortUrl(url);
      set(shortUrlResultAtom, response.shortenUrl);
      set(shortUrlInputAtom, response.shortenUrl);
      set(shortUrlLockedUntilChangeAtom, false);
      set(shortUrlCacheAtom, (prev) => ({
        ...prev,
        [url]: response.shortenUrl,
      }));
    } catch (error) {
      set(shortUrlErrorAtom, toErrorMessage(error));
    } finally {
      set(shortUrlLoadingAtom, false);
    }
  },
);

export const runShareCurrentUrlAtom = atom(null, async (get, set) => {
  if (typeof window === "undefined") return;
  const currentUrl = window.location.href;
  const cachedShortUrl = get(shortUrlCacheAtom)[currentUrl];
  if (cachedShortUrl != null) {
    set(shortUrlInputAtom, cachedShortUrl);
    set(shortUrlResultAtom, cachedShortUrl);
    set(shortUrlErrorAtom, null);
    set(shortUrlLockedUntilChangeAtom, false);
    return;
  }

  await set(runCreateShortUrlAtom, currentUrl);
});

export const seedSharedUrlAsGeneratedAtom = atom(
  null,
  (_get, set, sharedUrl: string) => {
    const url = sharedUrl.trim();
    if (url.length === 0) return;
    const isShortUrl = isShortUrlPath(url);
    if (!isShortUrl) {
      set(shortUrlLockedUntilChangeAtom, false);
      return;
    }

    set(shortUrlInputAtom, url);
    set(shortUrlResultAtom, url);
    set(shortUrlErrorAtom, null);
    set(shortUrlLockedUntilChangeAtom, true);
    set(shortUrlCacheAtom, (prev) => ({ ...prev, [url]: url }));
  },
);
