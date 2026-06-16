#!/usr/bin/env bash
# Publish DNS for AI Discovery (DNS-AID) records for rewrites.bio.
#
# Netlify DNS does not support SVCB/HTTPS record types in its UI or API.
# Use one of:
#   1. Cloudflare (recommended): host rewrites.bio on Cloudflare DNS, then run:
#        CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ZONE_ID=... ./scripts/publish-dns-aid.sh publish
#   2. Subdomain delegation: delegate _agents.rewrites.bio to a provider with SVCB support,
#      then publish into the child zone (see dns/README.md).
#
# Requires: curl, jq, python3

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RECORDS_FILE="${RECORDS_FILE:-$ROOT/dns/records.json}"
DOMAIN="${DNS_AID_DOMAIN:-rewrites.bio}"
DOH_RESOLVER="${DOH_RESOLVER:-https://cloudflare-dns.com/dns-query}"
SCAN_URL="${SCAN_URL:-https://isitagentready.com/api/scan}"

usage() {
  cat <<'EOF'
Usage: publish-dns-aid.sh <command>

Commands:
  publish     Upsert DNS-AID SVCB/HTTPS records (Cloudflare API)
  delegate    Add NS records at Netlify for _agents.<domain> delegation
  dnssec      Enable Cloudflare DNSSEC and print DS records for the registrar
  verify      Query DoH for DNS-AID records and run isitagentready scan
  show        Print zone-file style records from dns/records.json

Environment:
  CLOUDFLARE_API_TOKEN   Cloudflare API token (Zone.DNS Edit + Zone.DNS Settings)
  CLOUDFLARE_ZONE_ID     Cloudflare zone ID for rewrites.bio (or delegated child zone)
  NETLIFY_AUTH_TOKEN     Netlify personal access token (for delegate command)
  NETLIFY_ZONE_ID        Netlify DNS zone ID (optional; auto-discovered)
  DELEGATE_NS            Space-separated child nameservers (for delegate command)
  DNS_AID_DOMAIN         Domain (default: rewrites.bio)
EOF
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "error: required command not found: $1" >&2
    exit 1
  }
}

load_records() {
  require_cmd jq
  if [[ ! -f "$RECORDS_FILE" ]]; then
    echo "error: records file not found: $RECORDS_FILE" >&2
    exit 1
  fi
}

cf_api() {
  local method="$1"
  local path="$2"
  local data="${3:-}"

  if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    echo "error: CLOUDFLARE_API_TOKEN is required" >&2
    exit 1
  fi
  if [[ -z "${CLOUDFLARE_ZONE_ID:-}" ]]; then
    echo "error: CLOUDFLARE_ZONE_ID is required" >&2
    exit 1
  fi

  local args=(
    -sS
    -X "$method"
    "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}${path}"
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}"
    -H "Content-Type: application/json"
  )
  if [[ -n "$data" ]]; then
    args+=(--data "$data")
  fi

  local response
  response="$(curl "${args[@]}")"
  if ! echo "$response" | jq -e '.success == true' >/dev/null; then
    echo "error: Cloudflare API request failed: $path" >&2
    echo "$response" | jq '.' >&2 || echo "$response" >&2
    exit 1
  fi
  echo "$response"
}

upsert_cloudflare_record() {
  local name="$1"
  local type="$2"
  local priority="$3"
  local target="$4"
  local params="$5"
  local ttl="$6"

  local list
  list="$(cf_api GET "/dns_records?type=${type}&name=${name}.${DOMAIN}")"
  local existing_id
  existing_id="$(echo "$list" | jq -r --arg n "${name}.${DOMAIN}" '.result[] | select(.name == $n) | .id' | head -n1)"

  local payload
  payload="$(jq -n \
    --arg type "$type" \
    --arg name "$name" \
    --argjson priority "$priority" \
    --arg target "$target" \
    --arg value "$params" \
    --argjson ttl "$ttl" \
    '{
      type: $type,
      name: $name,
      ttl: $ttl,
      data: {
        priority: $priority,
        target: $target,
        value: $value
      }
    }')"

  if [[ -n "$existing_id" && "$existing_id" != "null" ]]; then
    echo "Updating ${type} ${name}.${DOMAIN} (id=${existing_id})"
    cf_api PUT "/dns_records/${existing_id}" "$payload" >/dev/null
  else
    echo "Creating ${type} ${name}.${DOMAIN}"
    cf_api POST "/dns_records" "$payload" >/dev/null
  fi
}

cmd_publish() {
  load_records
  local target ttl
  target="$(jq -r '.target' "$RECORDS_FILE")"
  ttl="$(jq -r '.ttl' "$RECORDS_FILE")"

  jq -c '.records[]' "$RECORDS_FILE" | while IFS= read -r record; do
    local name type priority params
    name="$(echo "$record" | jq -r '.name')"
    type="$(echo "$record" | jq -r '.type')"
    priority="$(echo "$record" | jq -r '.priority')"
    params="$(echo "$record" | jq -r '.params')"
    upsert_cloudflare_record "$name" "$type" "$priority" "$target" "$params" "$ttl"
  done

  echo "DNS-AID records published to Cloudflare zone ${CLOUDFLARE_ZONE_ID}."
  echo "Next: run './scripts/publish-dns-aid.sh dnssec' and add DS records at your registrar if needed."
}

netlify_api() {
  local method="$1"
  local path="$2"
  local data="${3:-}"

  if [[ -z "${NETLIFY_AUTH_TOKEN:-}" ]]; then
    echo "error: NETLIFY_AUTH_TOKEN is required" >&2
    exit 1
  fi

  local args=(
    -sS
    -X "$method"
    "https://api.netlify.com/api/v1${path}"
    -H "Authorization: Bearer ${NETLIFY_AUTH_TOKEN}"
    -H "Content-Type: application/json"
  )
  if [[ -n "$data" ]]; then
    args+=(--data "$data")
  fi

  curl "${args[@]}"
}

resolve_netlify_zone_id() {
  if [[ -n "${NETLIFY_ZONE_ID:-}" ]]; then
    echo "$NETLIFY_ZONE_ID"
    return
  fi

  local zones
  zones="$(netlify_api GET "/dns_zones")"
  local zone_id
  zone_id="$(echo "$zones" | jq -r --arg d "$DOMAIN" '.[] | select(.name == $d or .domain == $d) | .id' | head -n1)"
  if [[ -z "$zone_id" || "$zone_id" == "null" ]]; then
    echo "error: could not find Netlify DNS zone for ${DOMAIN}" >&2
    exit 1
  fi
  echo "$zone_id"
}

cmd_delegate() {
  require_cmd jq
  if [[ -z "${DELEGATE_NS:-}" ]]; then
    echo "error: DELEGATE_NS is required (space-separated child nameservers)" >&2
    echo "example: DELEGATE_NS='ada.ns.cloudflare.com bob.ns.cloudflare.com'" >&2
    exit 1
  fi

  local zone_id
  zone_id="$(resolve_netlify_zone_id)"
  local hostname="_agents.${DOMAIN}"

  for ns in $DELEGATE_NS; do
    local ns_value="$ns"
    if [[ "$ns_value" != *. ]]; then
      ns_value="${ns_value}."
    fi

    local payload
    payload="$(jq -n --arg hostname "$hostname" --arg value "$ns_value" '{type:"NS",hostname:$hostname,value:$value,ttl:3600}')"
  echo "Adding NS ${hostname} -> ${ns_value}"
    local response
    response="$(netlify_api POST "/dns_zones/${zone_id}/dns_records" "$payload")"
    if ! echo "$response" | jq -e '.id' >/dev/null 2>&1; then
      echo "warning: Netlify API response for NS ${ns_value}:" >&2
      echo "$response" | jq '.' >&2 || echo "$response" >&2
    fi
  done

  echo "Delegated ${hostname} to child nameservers."
  echo "Publish DNS-AID records in the child zone, then enable DNSSEC and add DS at Netlify."
}

cmd_dnssec() {
  local status
  status="$(cf_api GET "")"
  local current
  current="$(echo "$status" | jq -r '.result.status // empty')"

  if [[ "$current" != "active" ]]; then
    echo "Enabling Cloudflare DNSSEC..."
    cf_api PATCH "" '{"status":"active"}' >/dev/null
  else
    echo "Cloudflare DNSSEC already active."
  fi

  local ds
  ds="$(cf_api GET "/dnssec")"
  echo
  echo "Add these DS records at your domain registrar (or parent zone) if DNS is not fully on Cloudflare:"
  echo "$ds" | jq -r '.result.ds[]? | "\(.key_tag) \(.algorithm) \(.digest_type) \(.digest)"'
  echo
  echo "If using Netlify DNS as parent for a delegated _agents zone, add the DS record via Netlify DNS UI/API."
}

doh_query() {
  local qname="$1"
  local qtype="$2"
  curl -sS -G "$DOH_RESOLVER" \
    --data-urlencode "name=${qname}" \
    --data-urlencode "type=${qtype}" \
    --data-urlencode "do=1" \
    -H "accept: application/dns-json"
}

cmd_verify() {
  require_cmd jq
  load_records

  local ok=0
  jq -r '.records[] | "\(.type)\t\(.name)"' "$RECORDS_FILE" | while IFS=$'\t' read -r type name; do
    local fqdn="${name}.${DOMAIN}"
    local response
    response="$(doh_query "$fqdn" "$type")"
    local status answers ad
    status="$(echo "$response" | jq -r '.Status')"
    answers="$(echo "$response" | jq -r '.Answer // [] | length')"
    ad="$(echo "$response" | jq -r '.AD // false')"
    if [[ "$status" == "0" && "$answers" -gt 0 ]]; then
      echo "OK  ${type} ${fqdn} (answers=${answers}, AD=${ad})"
      echo "$response" | jq -r '.Answer[]? | "    \(.type) \(.data)"'
    else
      echo "MISSING  ${type} ${fqdn} (Status=${status})"
      ok=1
    fi
  done

  echo
  echo "Running isitagentready scan for https://${DOMAIN} ..."
  local scan
  scan="$(curl -sS -X POST "$SCAN_URL" -H "Content-Type: application/json" -d "{\"url\":\"https://${DOMAIN}\"}")"
  echo "$scan" | jq '{
    dnsAid: .checks.discoverability.dnsAid.status,
    message: .checks.discoverability.dnsAid.message,
    dnssecValidated: .checks.discoverability.dnsAid.details.dnssecValidated,
    serviceRecordCount: .checks.discoverability.dnsAid.details.serviceRecordCount
  }'
}

cmd_show() {
  load_records
  echo "; DNS for AI Discovery (DNS-AID) records for ${DOMAIN}"
  echo "; Generated from ${RECORDS_FILE}"
  echo "; Sign the zone with DNSSEC so validating resolvers return authenticated data."
  echo
  jq -r --arg domain "$DOMAIN" '
    . as $root |
    .records[] |
    "\(.name).\($domain). \($root.ttl) IN \(.type) \(.priority) \(.target) \(.params)"
  ' "$RECORDS_FILE"
}

main() {
  local command="${1:-}"
  case "$command" in
    publish) cmd_publish ;;
    delegate) cmd_delegate ;;
    dnssec) cmd_dnssec ;;
    verify) cmd_verify ;;
    show) cmd_show ;;
    -h|--help|help|"") usage ;;
    *)
      echo "error: unknown command: $command" >&2
      usage
      exit 1
      ;;
  esac
}

main "$@"
