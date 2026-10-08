import { stats } from "@/lib/data/server"
import { withAccount } from "@/lib/data/route"

export const GET = (req: Request) => withAccount(req, (s) => stats(s.accountId))
