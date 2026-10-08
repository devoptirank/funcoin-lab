import { notFound } from "next/navigation"

/**
 * Target of the proxy's "hidden" rewrite (admin paths on public hosts, unknown paths on the admin
 * host). Renders the ordinary 404 page, the same as any missing URL.
 */
export default function Hidden() {
  notFound()
}
