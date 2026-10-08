import { isBookmarked, toggleBookmark } from "@/lib/data/server"
import { withAccount } from "@/lib/data/route"

// Token waitlist: one row per wallet, stored with the account's bookmarks.
const REF = "waitlist-token"

export const GET = (req: Request) => withAccount(req, async (s) => ({ joined: await isBookmarked(s.accountId, REF) }))

export const POST = (req: Request) =>
  withAccount(req, async (s) => {
    if (!(await isBookmarked(s.accountId, REF))) await toggleBookmark(s.accountId, REF, { joinedAt: new Date().toISOString() })
    return { joined: true }
  })
