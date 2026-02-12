import { Hono } from "hono";

import type { AppEnv } from "../types";

const app = new Hono<AppEnv>();

export const healthRoute = app.get("/health", (c) => c.json({ ok: true }));

export const healthRoutes = app;
