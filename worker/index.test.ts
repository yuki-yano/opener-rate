import { beforeEach, describe, expect, it, vi } from "vitest";

const serveStaticOptionsSpy = vi.hoisted(() => vi.fn());

vi.mock("__STATIC_CONTENT_MANIFEST", () => ({ default: {} }));

vi.mock("hono/cloudflare-workers", () => ({
  serveStatic: (options: unknown) => {
    serveStaticOptionsSpy(options);
    return async (c: { text: (value: string) => Response }) => c.text("static");
  },
}));

describe("worker app entry", () => {
  beforeEach(() => {
    vi.resetModules();
    serveStaticOptionsSpy.mockReset();
  });

  it("mounts app routes before static handler", async () => {
    const mod = await import("./index");

    const response = await mod.default.request(
      "https://consistency-rate.pages.dev/health",
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("rewrites non-asset path to /index.html in static middleware", async () => {
    await import("./index");

    const options = serveStaticOptionsSpy.mock.calls[0]?.[0] as {
      rewriteRequestPath: (path: string) => string;
    };
    expect(options.rewriteRequestPath("/")).toBe("/index.html");
    expect(options.rewriteRequestPath("/editor")).toBe("/index.html");
    expect(options.rewriteRequestPath("/assets/main.js")).toBe(
      "/assets/main.js",
    );
  });

  it("keeps /api path unchanged in static middleware", async () => {
    await import("./index");

    const options = serveStaticOptionsSpy.mock.calls[0]?.[0] as {
      rewriteRequestPath: (path: string) => string;
    };
    expect(options.rewriteRequestPath("/api/shorten_url/create")).toBe(
      "/api/shorten_url/create",
    );
  });
});
