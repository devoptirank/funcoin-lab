// Registrar links (shared by server and client). An affiliate template, when set, takes priority.
// Templates use {domain} (URL-encoded) e.g. "https://www.dynadot.com/domain/search?domain={domain}&rscreg=YOURID".

const AFFILIATE = process.env.NEXT_PUBLIC_DOMAIN_AFFILIATE_URL_TEMPLATE?.trim() ?? ""
const SEARCH = process.env.NEXT_PUBLIC_REGISTRAR_SEARCH_URL?.trim() || "https://www.dynadot.com/domain/search?domain={domain}"

export const registrarName = process.env.NEXT_PUBLIC_REGISTRAR_NAME?.trim() || "Dynadot"
export const isAffiliateLink = AFFILIATE.length > 0

/** The external registrar URL for a domain. Only ever built from our own templates. */
export function buildRegistrarLink(domain: string): string {
  return (AFFILIATE || SEARCH).replaceAll("{domain}", encodeURIComponent(domain))
}

/** Internal tracked redirect. Use this for every outbound "buy" link. */
export function trackedRegistrarHref(domain: string, source: string): string {
  return `/go/domain?${new URLSearchParams({ d: domain, src: source }).toString()}`
}
