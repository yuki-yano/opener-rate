import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  create: vi.fn(),
  findTargetUrlByKey: vi.fn(),
}));

vi.mock("../db/client", () => ({
  getDb: mocks.getDb,
}));

vi.mock("../repositories/short-link-repository", () => ({
  shortLinkRepository: {
    create: mocks.create,
    findTargetUrlByKey: mocks.findTargetUrlByKey,
  },
}));

import { createShortUrl } from "./short-link-service";

describe("createShortUrl", () => {
  beforeEach(() => {
    mocks.getDb.mockReset();
    mocks.create.mockReset();
    mocks.findTargetUrlByKey.mockReset();

    mocks.getDb.mockReturnValue({ kind: "db" });
    mocks.create.mockResolvedValue(undefined);
  });

  it("rejects non-http(s) scheme", async () => {
    await expect(
      createShortUrl({
        bindings: { DB: {} as D1Database },
        url: "javascript:alert(1)",
        trustedOrigin: "https://consistency-rate.pages.dev",
      }),
    ).rejects.toMatchObject({ status: 400 } satisfies Partial<HTTPException>);

    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects cross-origin target url", async () => {
    await expect(
      createShortUrl({
        bindings: { DB: {} as D1Database },
        url: "https://evil.example/path",
        trustedOrigin: "https://consistency-rate.pages.dev",
      }),
    ).rejects.toMatchObject({ status: 400 } satisfies Partial<HTTPException>);

    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("allows same-origin target url and stores normalized value", async () => {
    const response = await createShortUrl({
      bindings: { DB: {} as D1Database },
      url: "https://consistency-rate.pages.dev/decks?id=1",
      trustedOrigin: "https://consistency-rate.pages.dev",
    });

    expect(response.shortenUrl).toMatch(
      /^https:\/\/consistency-rate\.pages\.dev\/short_url\/[0-9a-f]{8}$/,
    );
    expect(mocks.create).toHaveBeenCalledWith(
      { kind: "db" },
      expect.objectContaining({
        targetUrl: "https://consistency-rate.pages.dev/decks?id=1",
      }),
    );
  });

  it("allows local target with different local origin in dev", async () => {
    await expect(
      createShortUrl({
        bindings: { DB: {} as D1Database },
        url: "http://127.0.0.1:5173/?deck=abc",
        trustedOrigin: "http://127.0.0.1:8787",
      }),
    ).resolves.toMatchObject({
      shortenUrl: expect.stringMatching(
        /^http:\/\/127\.0\.0\.1:8787\/short_url\/[0-9a-f]{8}$/,
      ),
    });
  });

  it("allows configured APP_ORIGIN target and uses it for shorten url origin", async () => {
    const response = await createShortUrl({
      bindings: {
        DB: {} as D1Database,
        APP_ORIGIN: "https://app.example.com",
      },
      url: "https://app.example.com/?deck=shared",
      trustedOrigin: "https://preview.example.com",
    });

    expect(response.shortenUrl).toMatch(
      /^https:\/\/app\.example\.com\/short_url\/[0-9a-f]{8}$/,
    );
    expect(mocks.create).toHaveBeenCalledWith(
      { kind: "db" },
      expect.objectContaining({
        targetUrl: "https://app.example.com/?deck=shared",
      }),
    );
  });

  it("retries with a new key when insert hits unique constraint", async () => {
    mocks.create
      .mockRejectedValueOnce(
        new Error("UNIQUE constraint failed: short_links.key"),
      )
      .mockResolvedValueOnce(undefined);

    const response = await createShortUrl({
      bindings: { DB: {} as D1Database },
      url: "https://consistency-rate.pages.dev/decks?id=2",
      trustedOrigin: "https://consistency-rate.pages.dev",
    });

    expect(mocks.create).toHaveBeenCalledTimes(2);
    expect(response.shortenUrl).toMatch(
      /^https:\/\/consistency-rate\.pages\.dev\/short_url\/[0-9a-f]{8}$/,
    );
  });

  it("fails when unique key collision continues beyond retry limit", async () => {
    mocks.create.mockRejectedValue(
      new Error("UNIQUE constraint failed: short_links.key"),
    );

    await expect(
      createShortUrl({
        bindings: { DB: {} as D1Database },
        url: "https://consistency-rate.pages.dev/decks?id=3",
        trustedOrigin: "https://consistency-rate.pages.dev",
      }),
    ).rejects.toMatchObject({ status: 500 } satisfies Partial<HTTPException>);
  });
});
