// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";
import globals from "globals";

export default tseslint.config(
  // Build output and generated files (Prettier-ignored too).
  { ignores: ["dist/", ".astro/", ".netlify/"] },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,

  // Node-side files: build config and the markdown generation script.
  {
    files: ["**/*.mjs"],
    languageOptions: { globals: globals.node },
  },

  // Netlify edge functions run on Deno, not Node.
  {
    files: ["netlify/**/*.ts"],
    languageOptions: { globals: { ...globals.node, Deno: "readonly" } },
  },
);
