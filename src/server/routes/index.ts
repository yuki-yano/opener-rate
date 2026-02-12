import { Hono } from "hono";

import type { AppEnv } from "../types";
import { healthRoute, healthRoutes } from "./health";
import {
  createShortUrlRoute,
  resolveShortUrlRoute,
  shortLinkRoutes,
} from "./short-links";

const app = new Hono<AppEnv>();

export const route = app.route("/", healthRoutes).route("/", shortLinkRoutes);

export type AppType =
  | typeof healthRoute
  | typeof createShortUrlRoute
  | typeof resolveShortUrlRoute;

export default route;
