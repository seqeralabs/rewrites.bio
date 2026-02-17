# AGENTS.md — rewrites.bio

Guidance for AI coding agents working in this repository.

## Project Overview

A static website for the "Rewrite it: Bioinformatics edition" manifesto, built with **Astro** and deployed on **Netlify**. Content-driven site with no client-side framework — just vanilla JS for scroll animations and navbar tracking.

**Tech stack:** Astro 5, TypeScript (strict), plain CSS, YAML for content, Marked for inline markdown parsing. Hosted on Netlify with a Deno-based Edge Function for content negotiation.

## Build / Dev / Preview Commands

```sh
npm install            # Install dependencies
npm run dev            # Start dev server at localhost:4321
npm run build          # Production build to ./dist/
npm run preview        # Preview production build locally
```

All three commands first run `node scripts/generate-markdown.mjs` to generate markdown files from YAML before invoking Astro.

There is **no test framework**, no linter, and no formatter configured. No `npm test` script exists.

## Content Architecture (CRITICAL)

All manifesto content is defined in **`src/data/manifesto.yaml`** — this is the single source of truth.

At build time, `scripts/generate-markdown.mjs` auto-generates plain-text markdown files:
- `public/index.md`
- `public/manifesto.md`
- `public/.well-known/agent.md`

**These generated `.md` files are git-ignored. NEVER edit them directly.** All content changes must go through the YAML source file. The markdown files are regenerated on every build/dev/preview.

The YAML structure:
```yaml
preamble:        # Array of paragraph strings
callout:         # Block scalar string
preamble_closing: # Folded scalar string
sections:        # Array of {title, principles: [{title, description}]}
```

Principle descriptions support inline markdown (links, emphasis). Section numbering (I, II, 1.1, 1.2, etc.) is generated automatically by the components — do not hardcode numbers.

## Project Structure

```
src/
  components/    # Astro components (Hero, Section, Principle, Footer)
  data/          # manifesto.yaml — the content source
  layouts/       # Layout.astro — main HTML shell, nav, client JS
  pages/         # index.astro, og-image.astro
  styles/        # global.css — custom properties, resets, utilities
scripts/         # generate-markdown.mjs — build-time markdown generator
netlify/         # Edge function for markdown content negotiation
public/          # Static assets (favicon, og-image, robots.txt, llms.txt)
```

## Code Style Guidelines

### General

- No ESLint, Prettier, or Biome is configured — follow the existing style in each file.
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
- The edge function (`netlify/edge-functions/markdown.ts`) uses explicit return types on functions.
- Use `any` sparingly — it appears in `.map()` callbacks over YAML-parsed data but should be avoided where possible.

### Astro Components

- Frontmatter (between `---` fences) contains imports, type definitions, and data logic.
- Use `<slot />` for component children.
- Use `set:html` directive for pre-rendered HTML content (e.g., parsed markdown).
- Each component has a scoped `<style>` block at the bottom of the file.
- Components with no logic or props can have an empty or absent frontmatter section.

### CSS

- **No preprocessor, no Tailwind** — plain CSS with custom properties.
- CSS custom properties are defined in `:root` in `src/styles/global.css`:
  - Colors: `--bg-primary`, `--rust-*`, `--copper`, `--text-primary/secondary/tertiary`
  - Spacing scale: `--space-xs` through `--space-2xl`
  - Fonts: `--font-sans` (Inter), `--font-mono` (JetBrains Mono)
  - Layout: `--max-width: 720px`
- Use **BEM-like class naming**: `hero`, `hero-content`, `hero-title`, `section-header`, etc.
- Scoped styles in components. Use `:global()` only for dynamically created elements.
- Responsive breakpoints via `@media` queries. Respect `prefers-reduced-motion`.

### Client-Side JavaScript

- All client JS lives inline in `Layout.astro` within a `<script>` tag — not in separate files.
- Vanilla JS only (IntersectionObserver for reveal animations, section tracking, progress bar).
- Hooks into `astro:after-swap` for Astro view transitions compatibility.

### YAML

- 2-space indentation.
- Use block scalars (`|`) for multi-line strings that preserve newlines.
- Use folded scalars (`>`) for multi-line strings that should be joined.
- Inline markdown in principle descriptions (links, bold, emphasis).

## Naming Conventions

- **Files:** kebab-case for scripts and styles (`generate-markdown.mjs`, `global.css`). PascalCase for Astro components (`Hero.astro`, `Section.astro`).
- **CSS classes:** BEM-like kebab-case (`hero-content`, `section-header`, `principle-description`).
- **JS/TS functions:** camelCase (`initReveals`, `initProgressBar`, `preferredMarkdownType`).
- **Interfaces:** PascalCase (`Props`).
- **CSS custom properties:** kebab-case with semantic naming (`--bg-primary`, `--space-md`).

## Deployment

- **Netlify** via Git integration — push to `main` triggers an automatic build.
- Config in `netlify.toml`: builds with `npm run build`, publishes `dist/`.
- Edge function (`netlify/edge-functions/markdown.ts`) provides content negotiation — serves markdown when `Accept: text/markdown` or `text/plain` is preferred over `text/html`.

## Dependencies

Only three production dependencies (no devDependencies):
- `astro` — static site framework
- `marked` — markdown parsing for principle descriptions
- `yaml` — YAML parsing for content data

Keep dependencies minimal. This is a simple static site — avoid adding frameworks or heavy libraries.

## AI / LLM Discoverability

The site is designed for AI discoverability:
- `public/llms.txt` — LLM-friendly site index
- `public/robots.txt` — includes `Llms-Txt` directive
- `public/.well-known/agent.md` — auto-generated from YAML
- Netlify Edge Function serves markdown via content negotiation
