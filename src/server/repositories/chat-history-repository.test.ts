import { describe, expect, it, vi } from "vitest";

import { chatHistories } from "../db/schema";
import { chatHistoryRepository } from "./chat-history-repository";

describe("chatHistoryRepository", () => {
  it("creates a chat history row", async () => {
    const values = vi.fn().mockResolvedValue(undefined);
    const insert = vi.fn().mockReturnValue({ values });
    const db = { insert } as unknown as Parameters<
      typeof chatHistoryRepository.create
    >[0];

    await chatHistoryRepository.create(db, {
      key: "abc123de",
      messagesJson: '[{"role":"user","content":"hello"}]',
      now: 1730000000000,
    });

    expect(insert).toHaveBeenCalledWith(chatHistories);
    expect(values).toHaveBeenCalledWith({
      key: "abc123de",
      messagesJson: '[{"role":"user","content":"hello"}]',
      createdAt: 1730000000000,
      updatedAt: 1730000000000,
    });
  });

  it("returns null when chat history is not found", async () => {
    const limit = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });
    const db = { select } as unknown as Parameters<
      typeof chatHistoryRepository.findMessagesJsonByKey
    >[0];

    const found = await chatHistoryRepository.findMessagesJsonByKey(
      db,
      "missing",
    );

    expect(found).toBeNull();
  });

  it("returns stored messagesJson when key exists", async () => {
    const limit = vi
      .fn()
      .mockResolvedValue([
        { messagesJson: '[{"role":"assistant","content":"hello"}]' },
      ]);
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });
    const db = { select } as unknown as Parameters<
      typeof chatHistoryRepository.findMessagesJsonByKey
    >[0];

    const found = await chatHistoryRepository.findMessagesJsonByKey(
      db,
      "abc123de",
    );

    expect(found).toBe('[{"role":"assistant","content":"hello"}]');
  });
});
