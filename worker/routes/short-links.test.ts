import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  createShortUrl: vi.fn(),
  resolveShortUrlTarget: vi.fn(),
}));

vi.mock("../services/short-link-service", () => ({
  createShortUrl: serviceMocks.createShortUrl,
  resolveShortUrlTarget: serviceMocks.resolveShortUrlTarget,
}));

import { shortLinkRoutes } from "./short-links";

const env = { DB: {} as D1Database };

describe("shortLinkRoutes", () => {
  beforeEach(() => {
    serviceMocks.createShortUrl.mockReset();
    serviceMocks.resolveShortUrlTarget.mockReset();
    serviceMocks.createShortUrl.mockResolvedValue({
      shortenUrl: "https://consistency-rate.pages.dev/short_url/abc123de",
    });
  });

  it("rejects non-http(s) url on create route", async () => {
    const response = await shortLinkRoutes.request(
      "https://consistency-rate.pages.dev/api/shorten_url/create",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "javascript:alert(1)" }),
      },
      env,
    );

    expect(response.status).toBe(400);
    expect(serviceMocks.createShortUrl).not.toHaveBeenCalled();
  });

  it("uses trusted origin from request url even if origin header is forged", async () => {
    const response = await shortLinkRoutes.request(
      "https://consistency-rate.pages.dev/api/shorten_url/create",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://evil.example",
        },
        body: JSON.stringify({ url: "https://consistency-rate.pages.dev/" }),
      },
      env,
    );

    expect(response.status).toBe(200);
    expect(serviceMocks.createShortUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        trustedOrigin: "https://consistency-rate.pages.dev",
      }),
    );
  });

  it("falls back to root when resolved target is non-http(s)", async () => {
    serviceMocks.resolveShortUrlTarget.mockResolvedValue("javascript:alert(1)");

    const response = await shortLinkRoutes.request(
      "https://consistency-rate.pages.dev/short_url/abc123de",
      undefined,
      env,
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain(
      'window.location.replace("https://consistency-rate.pages.dev/")',
    );
    expect(html).not.toContain("javascript:alert(1)");
  });

  it("falls back to root when resolved target is different origin", async () => {
    serviceMocks.resolveShortUrlTarget.mockResolvedValue(
      "https://evil.example/path",
    );

    const response = await shortLinkRoutes.request(
      "https://consistency-rate.pages.dev/short_url/abc123de",
      undefined,
      env,
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain(
      'window.location.replace("https://consistency-rate.pages.dev/")',
    );
    expect(html).not.toContain("https://evil.example/path");
  });

  it("falls back to trusted-origin root when origin header is forged", async () => {
    serviceMocks.resolveShortUrlTarget.mockResolvedValue(
      "https://evil.example/path",
    );

    const response = await shortLinkRoutes.request(
      "https://consistency-rate.pages.dev/short_url/abc123de",
      {
        headers: {
          origin: "https://evil.example",
        },
      },
      env,
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain(
      'window.location.replace("https://consistency-rate.pages.dev/")',
    );
    expect(html).not.toContain("https://evil.example/path");
  });

  it("redirects when resolved target is safe same-origin url", async () => {
    serviceMocks.resolveShortUrlTarget.mockResolvedValue(
      "https://consistency-rate.pages.dev/?deckName=test",
    );

    const response = await shortLinkRoutes.request(
      "https://consistency-rate.pages.dev/short_url/abc123de",
      undefined,
      env,
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain(
      'window.location.replace("https://consistency-rate.pages.dev/?deckName=test")',
    );
  });
});
