import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  createShortUrl: vi.fn(),
  resolveShortUrlTarget: vi.fn(),
}));

vi.mock("../services/short-link-service", () => ({
  createShortUrl: serviceMocks.createShortUrl,
  resolveShortUrlTarget: serviceMocks.resolveShortUrlTarget,
}));

import route from "./index";

const env = { DB: {} as D1Database };

describe("route", () => {
  beforeEach(() => {
    serviceMocks.createShortUrl.mockReset();
    serviceMocks.resolveShortUrlTarget.mockReset();

    serviceMocks.createShortUrl.mockResolvedValue({
      shortenUrl: "https://consistency-rate.pages.dev/short_url/abc123de",
    });
    serviceMocks.resolveShortUrlTarget.mockResolvedValue({
      targetUrl: "https://consistency-rate.pages.dev/?deckName=test",
      deckName: "test",
    });
  });

  it("serves health endpoint", async () => {
    const response = await route.request(
      "https://consistency-rate.pages.dev/health",
      undefined,
      env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("serves shorten url creation endpoint", async () => {
    const response = await route.request(
      "https://consistency-rate.pages.dev/api/shorten_url/create",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://consistency-rate.pages.dev/" }),
      },
      env,
    );

    expect(response.status).toBe(200);
    expect(serviceMocks.createShortUrl).toHaveBeenCalledTimes(1);
  });

  it("serves short url redirect endpoint", async () => {
    const response = await route.request(
      "https://consistency-rate.pages.dev/short_url/abc123de",
      undefined,
      env,
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(serviceMocks.resolveShortUrlTarget).toHaveBeenCalledWith(
      expect.objectContaining({ key: "abc123de" }),
    );
    expect(html).toContain(
      'window.location.replace("https://consistency-rate.pages.dev/?deckName=test")',
    );
  });
});
