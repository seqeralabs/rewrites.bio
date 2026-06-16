# DNS for AI Discovery (DNS-AID)

Publish [DNS-AID](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/) records so agents can discover rewrites.bio endpoints through DNS before any HTTP request.

## Why this is not only a site change

DNS-AID records are **authoritative DNS data**, not files served by the Astro site. The isitagentready scanner queries:

- `SVCB` / `HTTPS` `_index._agents.rewrites.bio`
- `SVCB` / `HTTPS` `_a2a._agents.rewrites.bio`
- `SVCB` / `HTTPS` `_mcp._agents.rewrites.bio`

Each record must be in **ServiceMode** (`priority >= 1`) with at least `alpn` and `port`, and the zone must be **DNSSEC-signed** for `checks.discoverability.dnsAid` to pass.

## Netlify DNS limitation

rewrites.bio uses **Netlify DNS** (NS1 under the hood). Netlify's DNS UI and API only support A, AAAA, CNAME, MX, NS, TXT, and related types — **not SVCB or HTTPS** (RFC 9460).

Choose one of the paths below.

## Option A — Cloudflare DNS for rewrites.bio (recommended)

1. Add `rewrites.bio` to Cloudflare and point registrar nameservers to Cloudflare.
2. Recreate existing Netlify DNS records in Cloudflare (A/ALIAS/CNAME for the site, etc.).
3. Publish DNS-AID records:

```sh
export CLOUDFLARE_API_TOKEN="..."   # Zone.DNS Edit + Zone.DNS Settings
export CLOUDFLARE_ZONE_ID="..."
./scripts/publish-dns-aid.sh publish
./scripts/publish-dns-aid.sh dnssec
```

4. If the registrar is not Cloudflare, add the DS records printed by `dnssec`.
5. Verify:

```sh
./scripts/publish-dns-aid.sh verify
```

## Option B — Delegate only `_agents.rewrites.bio`

Keep Netlify DNS for the apex zone and delegate the `_agents` label to a provider with SVCB/HTTPS support (Cloudflare, Route 53, NS1, deSEC, etc.).

1. Create a child zone for `_agents.rewrites.bio` at the provider.
2. Delegate from Netlify:

```sh
export NETLIFY_AUTH_TOKEN="..."
export DELEGATE_NS="ada.ns.cloudflare.com bob.ns.cloudflare.com"  # example
./scripts/publish-dns-aid.sh delegate
```

3. In the **child zone**, publish records named `_index`, `_mcp`, and `_a2a` (see `dns/records.json`).
4. Enable DNSSEC on the child zone and add the resulting **DS** record in Netlify DNS for `_agents.rewrites.bio`.
5. Run `./scripts/publish-dns-aid.sh verify`.

## Record definitions

Canonical machine-readable config: [`dns/records.json`](records.json)

Zone-file style (for manual import):

```sh
./scripts/publish-dns-aid.sh show
```

Human-readable reference: [`netlify/dns-aid-records.example`](../netlify/dns-aid-records.example)

## GitHub Actions

Workflow [`.github/workflows/publish-dns-aid.yml`](../.github/workflows/publish-dns-aid.yml) can publish records when these repository secrets are set:

| Secret                 | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token                               |
| `CLOUDFLARE_ZONE_ID`   | Zone ID for `rewrites.bio` or delegated child zone |

Trigger manually via **Actions → Publish DNS-AID records → Run workflow**.

## References

- [DNS-AID skill](https://isitagentready.com/.well-known/agent-skills/dns-aid/SKILL.md)
- [DNS-AID draft](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/)
- [RFC 9460 (SVCB/HTTPS)](https://www.rfc-editor.org/rfc/rfc9460)
- [Agent readiness spec — DNS-AID](https://specification.website/spec/agent-readiness/dns-aid/)
