import "server-only"
import { getSetting } from "@/lib/settings"
import { checkTopic } from "@/lib/safety"

/**
 * The topic check with the admin-added blocked terms (site_settings "safety") merged on top of the
 * built-in list. Built-ins always apply, even if settings can't be read.
 */
export async function checkTopicServer(text: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  let extraTerms: string[] = []
  try {
    extraTerms = (await getSetting("safety")).extraTerms
  } catch {
    extraTerms = []
  }
  return checkTopic(text, extraTerms)
}
