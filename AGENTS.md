# AGENTS.md — rewrites.bio

See `CLAUDE.md` for full project overview, architecture, code style, and standard commands.

## Cursor Cloud specific instructions

This is a static **Astro** site (no backend, no database). Standard commands live in `CLAUDE.md` / `README.md` / `package.json` — reference those rather than duplicating.

- **Dev server:** `npm run dev` serves at `http://localhost:4321/` (does not auto-open a browser; bind/host flags are not configured).
- **Build:** `npm run build` runs `astro build` then `scripts/generate-markdown.mjs`. The script reads `dist/index.html` and writes `dist/index.md`, `dist/manifesto.md`, and `dist/.well-known/agent.md`. It must run after `astro build` — running it on a stale/missing `dist/` will fail.
- **Tests / lint / format:** none configured. There is no `npm test`, ESLint, Prettier, or Biome. Don't expect a lint/test step to exist.
- The generated `.md` files exist only in `dist/` (gitignored). All content edits go through `src/pages/index.astro` and the Astro components — never edit the generated markdown directly.
