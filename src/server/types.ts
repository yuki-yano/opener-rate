export type Bindings = {
  APP_ORIGIN?: string;
  DB: D1Database;
};

export type AppEnv = {
  Bindings: Bindings;
};
