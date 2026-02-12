import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReact from "eslint-plugin-react/configs/recommended.js";
import pluginReactJSXRuntime from "eslint-plugin-react/configs/jsx-runtime.js";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["src/**/*.{ts,tsx}"],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.esnext,
        ...globals.node,
      },
      parserOptions: {
        project: [
          "./tsconfig.app.json",
          "./tsconfig.server.json",
          "./tsconfig.node.json",
        ],
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact,
  pluginReactJSXRuntime,
  eslintConfigPrettier,
  {
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      "react-hooks": pluginReactHooks,
      "react-refresh": pluginReactRefresh,
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: [
            "BinaryExpression[operator='==='][left.type='Literal'][left.raw='null']",
            "BinaryExpression[operator='==='][right.type='Literal'][right.raw='null']",
            "BinaryExpression[operator='!=='][left.type='Literal'][left.raw='null']",
            "BinaryExpression[operator='!=='][right.type='Literal'][right.raw='null']",
            "BinaryExpression[operator='==='][left.type='Identifier'][left.name='undefined']",
            "BinaryExpression[operator='==='][right.type='Identifier'][right.name='undefined']",
            "BinaryExpression[operator='!=='][left.type='Identifier'][left.name='undefined']",
            "BinaryExpression[operator='!=='][right.type='Identifier'][right.name='undefined']",
          ].join(", "),
          message: "Use == null or != null for nullish comparisons.",
        },
      ],
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/display-name": "off",
      "react-refresh/only-export-components": "off",
    },
  },
  {
    ignores: [
      "dist",
      "node_modules",
      ".wrangler",
      "drizzle/meta",
      "tmp",
      "eslint.config.mjs",
      "postcss.config.js",
      "tailwind.config.js",
    ],
  },
]);
