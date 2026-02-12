export const parseChatErrorMessage = (error: Error | undefined) => {
  if (error == null) return null;
  const trimmed = error.message.trim();
  if (trimmed.length === 0) return "チャットエラーが発生しました";
  try {
    const parsed = JSON.parse(trimmed);
    if (
      typeof parsed === "object" &&
      parsed != null &&
      "error" in parsed &&
      typeof parsed.error === "string" &&
      parsed.error.trim().length > 0
    ) {
      return parsed.error;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
};
