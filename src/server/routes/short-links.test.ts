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

  it("resolves responseOrigin from x-forwarded headers", async () => {
    const response = await shortLinkRoutes.request(
      "https://consistency-rate.pages.dev/api/shorten_url/create",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-proto": "http",
          "x-forwarded-host": "share.example.com",
        },
        body: JSON.stringify({ url: "https://consistency-rate.pages.dev/" }),
      },
      env,
    );

    expect(response.status).toBe(200);
    expect(serviceMocks.createShortUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        trustedOrigin: "https://consistency-rate.pages.dev",
        responseOrigin: "http://share.example.com",
      }),
    );
  });

  it("normalizes local forwarded host 0.0.0.0 to 127.0.0.1", async () => {
    const response = await shortLinkRoutes.request(
      "http://127.0.0.1:8787/api/shorten_url/create",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-proto": "http",
          "x-forwarded-host": "0.0.0.0:8787",
          host: "0.0.0.0:8787",
        },
        body: JSON.stringify({ url: "http://127.0.0.1:8787/" }),
      },
      env,
    );

    expect(response.status).toBe(200);
    expect(serviceMocks.createShortUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        trustedOrigin: "http://127.0.0.1:8787",
        responseOrigin: "http://127.0.0.1:8787",
      }),
    );
  });

  it("falls back to root when resolved target is non-http(s)", async () => {
    serviceMocks.resolveShortUrlTarget.mockResolvedValue({
      targetUrl: "javascript:alert(1)",
      deckName: null,
    });

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
    serviceMocks.resolveShortUrlTarget.mockResolvedValue({
      targetUrl: "https://evil.example/path",
      deckName: null,
    });

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
    serviceMocks.resolveShortUrlTarget.mockResolvedValue({
      targetUrl: "https://evil.example/path",
      deckName: null,
    });

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
    serviceMocks.resolveShortUrlTarget.mockResolvedValue({
      targetUrl: "https://consistency-rate.pages.dev/?deckName=test",
      deckName: "test",
    });

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

  it("falls back to deckName extraction from target url when DB deckName is null", async () => {
    serviceMocks.resolveShortUrlTarget.mockResolvedValue({
      targetUrl:
        "https://consistency-rate.pages.dev/#deckName=%E9%9D%92%E7%9C%BC",
      deckName: null,
    });

    const response = await shortLinkRoutes.request(
      "https://consistency-rate.pages.dev/short_url/abc123de",
      undefined,
      env,
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain(
      '<meta property="og:title" content="初動率シミュレーター - 青眼" />',
    );
    expect(html).toContain(
      'window.location.replace("https://consistency-rate.pages.dev/#deckName=%E9%9D%92%E7%9C%BC")',
    );
  });

  it("uses stored deckName for OGP title", async () => {
    serviceMocks.resolveShortUrlTarget.mockResolvedValue({
      targetUrl: "https://consistency-rate.pages.dev/?deckName=query-name",
      deckName: "DB名",
    });

    const response = await shortLinkRoutes.request(
      "https://consistency-rate.pages.dev/short_url/abc123de",
      undefined,
      env,
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain(
      '<meta property="og:title" content="初動率シミュレーター - DB名" />',
    );
  });

  it("redirects when resolved target matches configured APP_ORIGIN", async () => {
    serviceMocks.resolveShortUrlTarget.mockResolvedValue({
      targetUrl: "https://app.example.com/?deckName=shared",
      deckName: "shared",
    });

    const response = await shortLinkRoutes.request(
      "https://preview.example.com/short_url/abc123de",
      undefined,
      {
        DB: {} as D1Database,
        APP_ORIGIN: "https://app.example.com",
      },
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain(
      'window.location.replace("https://app.example.com/?deckName=shared")',
    );
  });

  it("redirects when local origins differ by hostname", async () => {
    serviceMocks.resolveShortUrlTarget.mockResolvedValue({
      targetUrl: "http://localhost:5173/?deckName=local",
      deckName: "local",
    });

    const response = await shortLinkRoutes.request(
      "http://127.0.0.1:8787/short_url/abc123de",
      undefined,
      env,
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain(
      'window.location.replace("http://localhost:5173/?deckName=local")',
    );
  });

  it("falls back when APP_ORIGIN config is invalid", async () => {
    serviceMocks.resolveShortUrlTarget.mockResolvedValue({
      targetUrl: "https://app.example.com/?deckName=shared",
      deckName: "shared",
    });

    const response = await shortLinkRoutes.request(
      "https://preview.example.com/short_url/abc123de",
      undefined,
      {
        DB: {} as D1Database,
        APP_ORIGIN: "not-a-url",
      },
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain(
      'window.location.replace("https://preview.example.com/")',
    );
    expect(html).not.toContain("https://app.example.com/?deckName=shared");
  });
});
