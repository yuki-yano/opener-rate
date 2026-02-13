import { describe, expect, it } from "vitest";

import {
  DECK_NAME_MAX_LENGTH,
  extractDeckNameFromTargetUrl,
  extractDeckNameFromTargetUrlString,
} from "./deck-name";

describe("deck-name", () => {
  it("extracts deckName from hash with nested decode", () => {
    const deckName = extractDeckNameFromTargetUrlString(
      "https://example.com/#deckName=%2520Blue-Eyes%2520",
    );

    expect(deckName).toBe("Blue-Eyes");
  });

  it("prioritizes hash deckName over query deckName", () => {
    const url = new URL(
      "https://example.com/?deckName=QueryName#deckName=HashName",
    );

    expect(extractDeckNameFromTargetUrl(url)).toBe("HashName");
  });

  it("returns null when deckName is empty", () => {
    const deckName = extractDeckNameFromTargetUrlString(
      "https://example.com/?deckName=%20%20%20",
    );

    expect(deckName).toBeNull();
  });

  it("returns null when input is invalid url", () => {
    expect(extractDeckNameFromTargetUrlString("not-a-url")).toBeNull();
  });

  it("truncates deckName to max length", () => {
    const longDeckName = "A".repeat(DECK_NAME_MAX_LENGTH + 20);
    const deckName = extractDeckNameFromTargetUrlString(
      `https://example.com/?deckName=${longDeckName}`,
    );

    expect(deckName).toBe("A".repeat(DECK_NAME_MAX_LENGTH));
  });
});
