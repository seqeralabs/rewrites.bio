// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: process.env.URL || "https://rewrites.bio",
  build: {
    assets: "assets",
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/og-image"),
    }),
  ],
});
