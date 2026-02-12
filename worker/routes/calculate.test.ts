import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  calculateOpenerRate: vi.fn(),
}));

vi.mock("../services/calculation-service", () => ({
  calculateOpenerRate: serviceMocks.calculateOpenerRate,
}));

import { calculateRoutes } from "./calculate";

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

describe("calculateRoutes", () => {
  beforeEach(() => {
    serviceMocks.calculateOpenerRate.mockReset();
    serviceMocks.calculateOpenerRate.mockReturnValue({
      overallProbability: "0.00",
      patternSuccessRates: [],
      labelSuccessRates: [],
      mode: "exact",
    });
  });

  it("delegates valid request payload to calculation service", async () => {
    const response = await calculateRoutes.request(
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
    expect(serviceMocks.calculateOpenerRate).toHaveBeenCalledWith(validInput);
    await expect(response.json()).resolves.toEqual({
      overallProbability: "0.00",
      patternSuccessRates: [],
      labelSuccessRates: [],
      mode: "exact",
    });
  });

  it("returns 400 for schema-invalid payload", async () => {
    const response = await calculateRoutes.request(
      "https://consistency-rate.pages.dev/api/calculate",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...validInput,
          deck: { cardCount: 1, firstHand: 2 },
        }),
      },
      env,
    );

    expect(response.status).toBe(400);
    expect(serviceMocks.calculateOpenerRate).not.toHaveBeenCalled();
  });
});
