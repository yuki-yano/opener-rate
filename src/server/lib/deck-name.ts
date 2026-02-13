export const DECK_NAME_MAX_LENGTH = 100;

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

export const normalizeDeckName = (raw: string | null | undefined) => {
  if (raw == null || raw.length === 0) return null;
  const decoded = decodeNestedURIComponent(raw);
  const trimmed = decoded.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length <= DECK_NAME_MAX_LENGTH) return trimmed;
  return trimmed.slice(0, DECK_NAME_MAX_LENGTH);
};

export const extractDeckNameFromHash = (rawHash: string) => {
  if (rawHash.length === 0) return null;
  const hash = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
  if (hash.length === 0) return null;
  const hashParams = new URLSearchParams(hash);
  return normalizeDeckName(hashParams.get("deckName"));
};

export const extractDeckNameFromTargetUrl = (targetUrl: URL) => {
  const fromHash = extractDeckNameFromHash(targetUrl.hash);
  if (fromHash != null) return fromHash;
  return normalizeDeckName(targetUrl.searchParams.get("deckName"));
};

export const extractDeckNameFromTargetUrlString = (targetUrl: string) => {
  try {
    const parsed = new URL(targetUrl);
    return extractDeckNameFromTargetUrl(parsed);
  } catch {
    return null;
  }
};
