import { describe, expect, it } from "vitest";

import { healthRoutes } from "./health";

describe("healthRoutes", () => {
  it("returns ok status json", async () => {
    const response = await healthRoutes.request(
      "https://consistency-rate.pages.dev/health",
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
