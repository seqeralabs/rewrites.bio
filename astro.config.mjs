// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: process.env.URL || 'https://rewrites.bio',
  build: {
    assets: 'assets',
  },
});
