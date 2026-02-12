import { describe, expect, it } from "vitest";

import { ApiClientError } from "./errors";
import { createRpcShortUrlClient } from "./short-url-client";

const createMockClient = (postImpl: () => Promise<Response>) =>
  ({
    api: {
      shorten_url: {
        create: {
          $post: postImpl,
        },
      },
    },
  }) as const;

describe("createRpcShortUrlClient", () => {
  it("returns parsed response when schema is valid", async () => {
    const client = createRpcShortUrlClient(
      createMockClient(
        async () =>
          new Response(
            JSON.stringify({
              shortenUrl: "https://example.com/short_url/abc123de",
            }),
            { status: 200 },
          ),
      ) as never,
    );

    await expect(client.createShortUrl("https://example.com")).resolves.toEqual(
      {
        shortenUrl: "https://example.com/short_url/abc123de",
      },
    );
  });

  it("throws invalid_response_schema for malformed response body", async () => {
    const client = createRpcShortUrlClient(
      createMockClient(
        async () => new Response(JSON.stringify({ ok: true })),
      ) as never,
    );

    await expect(
      client.createShortUrl("https://example.com"),
    ).rejects.toMatchObject({
      name: "ApiClientError",
      code: "invalid_response_schema",
    } satisfies Partial<ApiClientError>);
  });

  it("throws http_error and preserves server message", async () => {
    const client = createRpcShortUrlClient(
      createMockClient(
        async () =>
          new Response(JSON.stringify({ error: "URL origin is not allowed" }), {
            status: 400,
          }),
      ) as never,
    );

    await expect(
      client.createShortUrl("https://example.com"),
    ).rejects.toMatchObject({
      name: "ApiClientError",
      code: "http_error",
      message: "URL origin is not allowed",
    } satisfies Partial<ApiClientError>);
  });

  it("throws network_error on transport failures", async () => {
    const client = createRpcShortUrlClient(
      createMockClient(async () => {
        throw new TypeError("Failed to fetch");
      }) as never,
    );

    await expect(
      client.createShortUrl("https://example.com"),
    ).rejects.toMatchObject({
      name: "ApiClientError",
      code: "network_error",
    } satisfies Partial<ApiClientError>);
  });
});
