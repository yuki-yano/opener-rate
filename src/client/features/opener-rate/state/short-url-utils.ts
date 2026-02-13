export const normalizeShareSourceUrl = (rawUrl: string): string => {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.searchParams.get("mode") === "ai") {
      parsed.searchParams.delete("mode");
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
};
