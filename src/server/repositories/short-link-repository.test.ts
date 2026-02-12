import { describe, expect, it, vi } from "vitest";

import { shortLinks } from "../db/schema";
import { shortLinkRepository } from "./short-link-repository";

describe("shortLinkRepository", () => {
  it("creates a short link row", async () => {
    const values = vi.fn().mockResolvedValue(undefined);
    const insert = vi.fn().mockReturnValue({ values });
    const db = { insert } as unknown as Parameters<
      typeof shortLinkRepository.create
    >[0];

    await shortLinkRepository.create(db, {
      key: "abc123de",
      targetUrl: "https://consistency-rate.pages.dev/?deckName=test",
      now: 1730000000000,
    });

    expect(insert).toHaveBeenCalledWith(shortLinks);
    expect(values).toHaveBeenCalledWith({
      key: "abc123de",
      targetUrl: "https://consistency-rate.pages.dev/?deckName=test",
      createdAt: 1730000000000,
      updatedAt: 1730000000000,
    });
  });

  it("returns null when target url is not found", async () => {
    const limit = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });
    const db = { select } as unknown as Parameters<
      typeof shortLinkRepository.findTargetUrlByKey
    >[0];

    const found = await shortLinkRepository.findTargetUrlByKey(db, "missing");

    expect(found).toBeNull();
  });

  it("returns stored target url when key exists", async () => {
    const limit = vi
      .fn()
      .mockResolvedValue([
        { targetUrl: "https://consistency-rate.pages.dev/?deckName=shared" },
      ]);
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });
    const db = { select } as unknown as Parameters<
      typeof shortLinkRepository.findTargetUrlByKey
    >[0];

    const found = await shortLinkRepository.findTargetUrlByKey(db, "abc123de");

    expect(found).toBe("https://consistency-rate.pages.dev/?deckName=shared");
  });
});
