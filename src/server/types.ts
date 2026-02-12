export type Bindings = {
  APP_ORIGIN?: string;
  DB: D1Database;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  GOOGLE_AI_GATEWAY_URL?: string;
};

export type AppEnv = {
  Bindings: Bindings;
};
