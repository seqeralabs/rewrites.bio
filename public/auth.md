# auth.md

> Agent authentication for rewrites.bio

## Audience

AI agents and automated clients accessing rewrites.bio content.

## Authentication

All content on rewrites.bio is **public**. No registration, credentials, or OAuth tokens are required.

## Access methods

| Resource | URL | Auth |
|---|---|---|
| Manifesto (markdown) | https://rewrites.bio/manifesto.md | None |
| Manifesto (HTML) | https://rewrites.bio/ | None |
| Markdown negotiation | `Accept: text/markdown` on https://rewrites.bio/ | None |
| Agent instructions | https://rewrites.bio/.well-known/agent.md | None |

## Registration

Not applicable — this is a read-only public manifesto site with no protected APIs.

## Contact

Source repository: https://github.com/seqeralabs/rewrites.bio
