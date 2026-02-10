import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { calculateInputSchema } from "../../src/shared/apiSchemas";
import { calculateOpenerRate } from "../services/calculation-service";
import type { AppEnv } from "../types";

const app = new Hono<AppEnv>();

export const calculateRoute = app.post(
  "/api/calculate",
  zValidator("json", calculateInputSchema),
  async (c) => {
    const input = c.req.valid("json");
    const result = calculateOpenerRate(input);
    return c.json(result);
  },
);

export const calculateRoutes = app;
