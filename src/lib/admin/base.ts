import "server-only"
import { headers } from "next/headers"
import { isAdminHost } from "@/lib/hosts"

/** Path prefix for admin links: "" on admin.funcoinlab.com, "/admin" on localhost and previews. */
export async function adminBase(): Promise<string> {
  return isAdminHost((await headers()).get("host") ?? "") ? "" : "/admin"
}
