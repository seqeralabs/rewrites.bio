<h1 align="center">
  <a href="https://rewrites.bio"><img src="public/og-image.svg" alt="rewrites.bio" /></a>
</h1>

## rewrites.bio

A manifesto for AI-assisted modernisation of bioinformatics software.

Live site: [https://rewrites.bio](https://rewrites.bio)



## Development

```sh
npm install
npm run dev       # Start dev server at localhost:4321
npm run build     # Build to ./dist/
npm run preview   # Preview production build
```

## Content

All manifesto content lives in the Astro source files (`src/pages/index.astro` and components). At build time, a post-build script converts the rendered HTML to clean markdown for LLM consumption:

- **`/manifesto.md`** — Full manifesto in markdown
- **`/llms.txt`** — LLM-friendly site index
- **`/.well-known/agent.md`** — AI agent discovery

## Deployment

Configured for Netlify (see `netlify.toml`). Push to `main` to deploy.

## License

Open source under the [MIT License](LICENSE).
