import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  calculateOpenerRate: vi.fn(),
  createShortUrl: vi.fn(),
  resolveShortUrlTarget: vi.fn(),
}));

vi.mock("../services/calculation-service", () => ({
  calculateOpenerRate: serviceMocks.calculateOpenerRate,
}));

vi.mock("../services/short-link-service", () => ({
  createShortUrl: serviceMocks.createShortUrl,
  resolveShortUrlTarget: serviceMocks.resolveShortUrlTarget,
}));

import route from "./index";

const env = { DB: {} as D1Database };

const validInput = {
  deck: { cardCount: 40, firstHand: 5 },
  cards: [],
  patterns: [],
  subPatterns: [],
  labels: [],
  pot: {
    desiresOrExtravagance: { count: 0 },
    prosperity: { count: 0, cost: 6 },
  },
  settings: {
    mode: "exact",
    simulationTrials: 100,
  },
} as const;

describe("route", () => {
  beforeEach(() => {
    serviceMocks.calculateOpenerRate.mockReset();
    serviceMocks.createShortUrl.mockReset();
    serviceMocks.resolveShortUrlTarget.mockReset();

    serviceMocks.calculateOpenerRate.mockReturnValue({
      overallProbability: "0.00",
      patternSuccessRates: [],
      labelSuccessRates: [],
      mode: "exact",
    });
    serviceMocks.createShortUrl.mockResolvedValue({
      shortenUrl: "https://consistency-rate.pages.dev/short_url/abc123de",
    });
    serviceMocks.resolveShortUrlTarget.mockResolvedValue(
      "https://consistency-rate.pages.dev/?deckName=test",
    );
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

  it("serves calculate endpoint", async () => {
    const response = await route.request(
      "https://consistency-rate.pages.dev/api/calculate",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validInput),
      },
      env,
    );

    expect(response.status).toBe(200);
    expect(serviceMocks.calculateOpenerRate).toHaveBeenCalledTimes(1);
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
