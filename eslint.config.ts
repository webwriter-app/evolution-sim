import { defineConfig, globalIgnores } from "eslint/config";

import eslintJS from "@eslint/js";
import eslintTS from "typescript-eslint";

import vitestEslint from "@vitest/eslint-plugin";
import { configs as litEslint } from "eslint-plugin-lit";
import prettierEslint from "eslint-plugin-prettier/recommended";

export default defineConfig(
  globalIgnores([
    "coverage",
    "**/dist/",
    "localization/generated/",
    "node_modules",
  ]),
  {
    extends: [
      eslintJS.configs.recommended,
      eslintTS.configs.strict,
      vitestEslint.configs.recommended,
      litEslint["flat/recommended"],
      prettierEslint,
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },

    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
);
