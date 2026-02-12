import { Hono } from "hono";

import type { AppEnv } from "../types";
import {
  aiChatRoutes,
  chatRoute,
  createChatHistoryRoute,
  getChatHistoryRoute,
} from "./ai-chat";
import { healthRoute, healthRoutes } from "./health";
import {
  createShortUrlRoute,
  resolveShortUrlRoute,
  shortLinkRoutes,
} from "./short-links";

const app = new Hono<AppEnv>();

export const route = app
  .route("/", healthRoutes)
  .route("/", shortLinkRoutes)
  .route("/", aiChatRoutes);

export type AppType =
  | typeof healthRoute
  | typeof createShortUrlRoute
  | typeof resolveShortUrlRoute
  | typeof chatRoute
  | typeof createChatHistoryRoute
  | typeof getChatHistoryRoute;

export default route;
