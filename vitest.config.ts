import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tmp/**", "node_modules/**", "dist/**", ".wrangler/**"],
  },
});
