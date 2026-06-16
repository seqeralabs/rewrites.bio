# AGENTS.md — rewrites.bio

Guidance for AI coding agents working in this repository.

## Project Overview

A static website for the "Rewrite it: Bioinformatics edition" manifesto, built with **Astro** and deployed on **Netlify**. Content-driven site with no client-side framework — just vanilla JS for scroll animations and navbar tracking.

**Tech stack:** Astro 5, TypeScript (strict), plain CSS. Hosted on Netlify.

## Build / Dev / Preview Commands

```sh
npm install            # Install dependencies
npm run dev            # Start dev server at localhost:4321
npm run build          # Production build to ./dist/ (includes markdown generation)
npm run preview        # Preview production build locally
npm run format         # Format the repo with Prettier
npm run format:check   # Check formatting without writing
npm run lint           # Lint with ESLint
npm run lint:fix       # Lint and auto-fix
```

The `build` command runs `astro build` then `node scripts/generate-markdown.mjs` to generate markdown files from the built HTML.

There is **no test framework** and no `npm test` script. **Prettier** handles formatting (config under the `"prettier"` key in `package.json`) and **ESLint** handles linting (flat config in `eslint.config.js`: `typescript-eslint` + `eslint-plugin-astro`).

### Formatting & linting / pre-commit (prek)

Hooks are managed by [**prek**](https://prek.j178.dev) — a fast Rust reimplementation of pre-commit — configured in `prek.toml` (note: there is **no** `.pre-commit-config.yaml`; use `prek`, not `pre-commit`). Hooks: Prettier and ESLint (`local` hooks running the pinned binaries), `typos`, and builtin hygiene checks (trailing whitespace, EOF newline, etc.).

```sh
prek install           # Install the git hook (one-time, per clone)
prek run --all-files   # Run every hook across the repo
```

## Content Architecture (CRITICAL)

All manifesto content is defined in **`src/pages/index.astro`** and its Astro components — this is the single source of truth.

At build time, `scripts/generate-markdown.mjs` reads `dist/index.html`, strips visuals and navigation, and converts the content to clean markdown. Output files:

- `dist/index.md`
- `dist/manifesto.md` (copy of index.md)
- `dist/.well-known/agent.md` (short summary for AI agent discovery)

**These generated `.md` files live in `dist/` only.** All content changes go through the Astro source files. Markdown is regenerated on every production build.

## Project Structure

```
src/
  components/    # Astro components (Hero, Section, Principle, Footer, TableOfContents)
  components/visuals/  # SVG-based visual illustrations for each principle
  layouts/       # Layout.astro — main HTML shell, nav, client JS
  pages/         # index.astro, og-image.astro
  styles/        # global.css — custom properties, resets, utilities
scripts/         # generate-markdown.mjs — post-build HTML→markdown converter
public/          # Static assets (favicon, og-image, robots.txt, llms.txt)
```

## Code Style Guidelines

### General

- **Prettier** (with `prettier-plugin-astro`) handles formatting and **ESLint** handles linting; both are enforced via prek. Run `npm run format` and `npm run lint`.
- Use **2-space indentation** throughout (Astro, TS, JS, CSS, YAML).
- Use **double quotes** for JavaScript/TypeScript strings.
- Use **trailing commas** in function arguments and object literals.
- ESM modules only (`"type": "module"` in package.json). Use `import`/`export`, never `require`.

### TypeScript

- Strict mode is enabled (`astro/tsconfigs/strict`).
- Component props use the `interface Props` pattern, then destructure from `Astro.props`:
  ```astro
  ---
  interface Props {
    id: string;
    title: string;
    description?: string;
  }
  const { id, title, description = "default" } = Astro.props;
  ---
  ```
- Use `any` sparingly — avoid where possible.

### Astro Components

- Frontmatter (between `---` fences) contains imports, type definitions, and data logic.
- Use `<slot />` for component children.
- Each component has a scoped `<style>` block at the bottom of the file.
- Components with no logic or props can have an empty or absent frontmatter section.

### CSS

- **No preprocessor, no Tailwind** — plain CSS with custom properties.
- CSS custom properties are defined in `:root` in `src/styles/global.css`:
  - Colors: `--bg-primary`, `--accent-rust`, `--accent-blue`, `--accent-gold`, `--accent-sage`, `--text-primary/secondary/tertiary`
  - Spacing scale: `--space-xs` through `--space-2xl`
  - Fonts: `--font-sans` (Plus Jakarta Sans), `--font-serif` (Newsreader), `--font-mono` (JetBrains Mono)
  - Layout: `--max-width: 1100px`, `--text-width: 680px`
- Use **BEM-like class naming**: `hero`, `hero-content`, `hero-title`, `section-header`, etc.
- Scoped styles in components. Use `:global()` only for dynamically created elements.
- Responsive breakpoints via `@media` queries. Respect `prefers-reduced-motion`.

### Client-Side JavaScript

- All client JS lives inline in `Layout.astro` within a `<script>` tag — not in separate files.
- Vanilla JS only (IntersectionObserver for reveal animations, section tracking, progress bar).
- Hooks into `astro:after-swap` for Astro view transitions compatibility.

## Naming Conventions

- **Files:** kebab-case for scripts and styles (`generate-markdown.mjs`, `global.css`). PascalCase for Astro components (`Hero.astro`, `Section.astro`).
- **CSS classes:** BEM-like kebab-case (`hero-content`, `section-header`, `principle-description`).
- **JS/TS functions:** camelCase (`initReveals`, `initProgressBar`).
- **Interfaces:** PascalCase (`Props`).
- **CSS custom properties:** kebab-case with semantic naming (`--bg-primary`, `--space-md`).

## Deployment

- **Netlify** via Git integration — push to `main` triggers an automatic build.
- Config in `netlify.toml`: builds with `npm run build`, publishes `dist/`.

## Dependencies

Production dependencies:

- `astro` — static site framework
- `@astrojs/sitemap` — sitemap generation
- `turndown` — HTML-to-markdown conversion for post-build markdown generation

Dev dependencies (tooling only, not shipped):

- `prettier` + `prettier-plugin-astro` — formatting
- `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-astro`, `globals` — linting

Keep dependencies minimal. This is a simple static site — avoid adding frameworks or heavy libraries.

## AI / LLM Discoverability

The site is designed for AI discoverability:

- `public/llms.txt` — LLM-friendly site index
- `public/robots.txt` — includes `Llms-Txt` directive
- `dist/.well-known/agent.md` — auto-generated from HTML at build time
- `dist/manifesto.md` — full manifesto in markdown, auto-generated at build time
