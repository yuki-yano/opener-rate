import { atom } from "jotai";

import { openerRateApi } from "../../api/opener-rate-api";
import { ApiClientError } from "../../api/errors";
import type { CalculateInput } from "../../../../../shared/apiSchemas";
import { calculateInputAtom } from "../derived/atoms";
import { normalizeShareSourceUrl } from "../short-url-utils";
import {
  calculationResultAtom,
  isCalculatingAtom,
  previousCalculationResultAtom,
  savedInputAtom,
  shortUrlCacheAtom,
  shortUrlErrorAtom,
  shortUrlInputAtom,
  shortUrlLockedSourceHrefAtom,
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

const shortUrlLockStorageKey = "openerRate.shortUrlLockState";
type PersistedShortUrlLockState = {
  sourceHref: string;
  sharedShortUrl: string;
};

const getSessionStorage = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const readShortUrlLockState = (): PersistedShortUrlLockState | null => {
  const storage = getSessionStorage();
  if (storage == null) return null;
  try {
    const raw = storage.getItem(shortUrlLockStorageKey);
    if (raw == null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed == null) return null;
    if (!("sourceHref" in parsed) || !("sharedShortUrl" in parsed)) {
      return null;
    }
    const sourceHref = parsed.sourceHref;
    const sharedShortUrl = parsed.sharedShortUrl;
    if (
      typeof sourceHref !== "string" ||
      sourceHref.length === 0 ||
      typeof sharedShortUrl !== "string" ||
      sharedShortUrl.length === 0
    ) {
      return null;
    }
    return { sourceHref, sharedShortUrl };
  } catch {
    return null;
  }
};

const writeShortUrlLockState = (state: PersistedShortUrlLockState | null) => {
  const storage = getSessionStorage();
  if (storage == null) return;
  try {
    if (state == null) {
      storage.removeItem(shortUrlLockStorageKey);
      return;
    }
    storage.setItem(shortUrlLockStorageKey, JSON.stringify(state));
  } catch {
    // storage が使えない環境は永続化をスキップ
  }
};

const getCurrentHref = () => {
  if (typeof window === "undefined") return null;
  return window.location.href;
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
    const rawUrl = (sourceUrl ?? get(shortUrlInputAtom)).trim();
    const url = normalizeShareSourceUrl(rawUrl);
    if (url.length === 0) {
      set(shortUrlErrorAtom, "URLを入力してください");
      return;
    }

    set(shortUrlLoadingAtom, true);
    set(shortUrlErrorAtom, null);
    set(shortUrlResultAtom, null);
    try {
      const response = await openerRateApi.createShortUrl(url);
      const currentHref = getCurrentHref();
      const normalizedCurrentHref =
        currentHref == null ? null : normalizeShareSourceUrl(currentHref);
      const shouldLock =
        normalizedCurrentHref != null && normalizedCurrentHref === url;
      set(shortUrlResultAtom, response.shortenUrl);
      set(shortUrlInputAtom, response.shortenUrl);
      set(shortUrlLockedUntilChangeAtom, shouldLock);
      set(shortUrlLockedSourceHrefAtom, shouldLock ? url : null);
      writeShortUrlLockState(
        shouldLock
          ? {
              sourceHref: url,
              sharedShortUrl: response.shortenUrl,
            }
          : null,
      );
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
  const currentUrl = normalizeShareSourceUrl(window.location.href);
  const cachedShortUrl = get(shortUrlCacheAtom)[currentUrl];
  if (cachedShortUrl != null) {
    set(shortUrlInputAtom, cachedShortUrl);
    set(shortUrlResultAtom, cachedShortUrl);
    set(shortUrlErrorAtom, null);
    set(shortUrlLockedUntilChangeAtom, true);
    set(shortUrlLockedSourceHrefAtom, currentUrl);
    writeShortUrlLockState({
      sourceHref: currentUrl,
      sharedShortUrl: cachedShortUrl,
    });
    return;
  }

  await set(runCreateShortUrlAtom, currentUrl);
});

export const hydrateShortUrlLockAtom = atom(null, (_get, set) => {
  const persisted = readShortUrlLockState();
  if (persisted == null) return;

  const currentHref = getCurrentHref();
  const normalizedCurrentHref =
    currentHref == null ? null : normalizeShareSourceUrl(currentHref);
  const normalizedPersistedSourceHref = normalizeShareSourceUrl(
    persisted.sourceHref,
  );
  if (
    normalizedCurrentHref == null ||
    normalizedCurrentHref !== normalizedPersistedSourceHref
  ) {
    writeShortUrlLockState(null);
    return;
  }

  set(shortUrlInputAtom, persisted.sharedShortUrl);
  set(shortUrlResultAtom, persisted.sharedShortUrl);
  set(shortUrlErrorAtom, null);
  set(shortUrlLockedUntilChangeAtom, true);
  set(shortUrlLockedSourceHrefAtom, normalizedPersistedSourceHref);
  set(shortUrlCacheAtom, (prev) => ({
    ...prev,
    [persisted.sharedShortUrl]: persisted.sharedShortUrl,
  }));
});

export const seedSharedUrlAsGeneratedAtom = atom(
  null,
  (_get, set, sharedUrl: string) => {
    const url = sharedUrl.trim();
    if (url.length === 0) return;
    const isShortUrl = isShortUrlPath(url);
    if (!isShortUrl) {
      set(shortUrlLockedUntilChangeAtom, false);
      set(shortUrlLockedSourceHrefAtom, null);
      writeShortUrlLockState(null);
      return;
    }

    const sourceHrefRaw = getCurrentHref();
    const sourceHref =
      sourceHrefRaw == null ? null : normalizeShareSourceUrl(sourceHrefRaw);
    set(shortUrlInputAtom, url);
    set(shortUrlResultAtom, url);
    set(shortUrlErrorAtom, null);
    set(shortUrlLockedUntilChangeAtom, true);
    set(shortUrlLockedSourceHrefAtom, sourceHref);
    set(shortUrlCacheAtom, (prev) => ({ ...prev, [url]: url }));
    if (sourceHref != null) {
      writeShortUrlLockState({
        sourceHref,
        sharedShortUrl: url,
      });
    }
  },
);
