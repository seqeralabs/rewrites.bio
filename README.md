<h1 align="center">
  <a href="https://riir.bio"><img src="public/og-image.png" alt="RiiR.bio" /></a>
</h1>

A manifesto for AI-assisted modernisation of bioinformatics software.

**Live site:** [riir.bio](https://riir.bio)

## Development

```sh
npm install
npm run dev       # Start dev server at localhost:4321
npm run build     # Build to ./dist/
npm run preview   # Preview production build
```

## Structure

```
src/
  layouts/Layout.astro        # Base layout with nav, progress bar, reveal animations
  components/
    Hero.astro                # Landing hero section
    Section.astro             # Manifesto section wrapper
    Principle.astro           # Individual numbered principle
  pages/
    index.astro               # Manifesto page
    projects.astro            # Rust rewrite projects
    og-image.astro            # Social share card (render page)
  styles/global.css           # Theme, typography, animations
public/
  manifesto.md                # Plain markdown version of the manifesto
  projects.md                 # Plain markdown version of the projects list
  index.md                    # Alias for manifesto.md
  og-image.png                # Social share card
  favicon.svg                 # SVG favicon
  favicon.ico                 # ICO favicon
netlify/
  edge-functions/markdown.ts  # Serves markdown for Accept: text/markdown requests
```

## Deployment

Configured for Netlify (see `netlify.toml`). Push to `main` to deploy.

## License

Open source under the [MIT License](LICENSE).
