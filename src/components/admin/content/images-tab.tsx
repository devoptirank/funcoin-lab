import Link from "next/link"
import { ImageOff } from "lucide-react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { AdminAction } from "@/components/admin/admin-action"
import { adminHref } from "@/components/admin/admin-href"
import { MaskedAddress } from "@/components/admin/masked-address"
import { Badge, Empty, Filters, Pager, When, statusTone } from "@/components/admin/ui"
import { ASSET_TYPES, listImages, type ImageFilters } from "./data"
import type { ContentPerms } from "./sites-tab"

export async function ImagesTab({
  sb,
  base,
  filters,
  page,
  perms,
}: {
  sb: SupabaseClient
  base: string
  filters: ImageFilters
  page: { page: number; from: number; to: number }
  perms: ContentPerms
}) {
  const size = page.to - page.from + 1
  const rows = await listImages(sb, filters, page.from, page.to + 1)
  const hasMore = rows.length > size
  const images = rows.slice(0, size)
  const action = adminHref(base, "/content")
  const params: Record<string, string> = { tab: "images" }
  if (filters.type) params.type = filters.type
  if (filters.from) params.from = filters.from
  if (filters.to) params.to = filters.to
  if (filters.owner) params.owner = filters.owner
  if (filters.status !== "ok") params.status = filters.status

  return (
    <>
      <Filters action={action}>
        <input type="hidden" name="tab" value="images" />
        <label>
          Type
          <select name="type" defaultValue={filters.type}>
            <option value="">All types</option>
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          From
          <input type="date" name="from" defaultValue={filters.from} />
        </label>
        <label>
          To
          <input type="date" name="to" defaultValue={filters.to} />
        </label>
        <label>
          Owner wallet
          <input name="owner" defaultValue={filters.owner.replace(/^sol:/, "")} placeholder="Full address" maxLength={48} />
        </label>
        <label>
          Status
          <select name="status" defaultValue={filters.status}>
            <option value="ok">Visible</option>
            <option value="hidden">Hidden</option>
            <option value="removed">Removed</option>
            <option value="all">All</option>
          </select>
        </label>
      </Filters>

      {images.length === 0 ? (
        <Empty>No images match these filters.</Empty>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((a) => (
            <li key={a.id} className="flex flex-col overflow-hidden rounded-lg border border-border">
              <div className="flex aspect-square items-center justify-center bg-foreground/5">
                {a.moderation_status === "removed" ? (
                  <span className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                    <ImageOff className="size-5" aria-hidden /> File deleted
                  </span>
                ) : (
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="block size-full">
                    {/* eslint-disable-next-line @next/next/no-img-element -- public storage URLs of any size */}
                    <img src={a.url} alt={`${a.type} image`} loading="lazy" className="size-full object-contain" />
                  </a>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-2 text-xs">
                <div className="flex flex-wrap items-center gap-1">
                  <Badge>{a.type}</Badge>
                  <Badge tone={statusTone(a.moderation_status)}>{a.moderation_status}</Badge>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <MaskedAddress value={a.account_id} link={false} />
                  <Link href={adminHref(base, "/users/" + encodeURIComponent(a.account_id))} className="text-muted-foreground hover:text-foreground hover:underline">
                    User
                  </Link>
                </div>
                <When iso={a.created_at} />
                {a.moderation_reason && a.moderation_status !== "ok" && <p className="text-muted-foreground">{a.moderation_reason}</p>}
                {perms.moderate && a.moderation_status !== "removed" && (
                  <AdminAction
                    label="Remove"
                    endpoint="/api/admin/content/images/remove"
                    payload={{ assetId: a.id }}
                    title="Remove this image"
                    description="Marks the image removed and permanently deletes the file from storage. Sites that used it will show a broken image. This can't be undone."
                    confirmLabel="Remove image"
                    destructive
                    size="xs"
                    className="mt-auto self-start"
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pager base={action} params={params} page={page.page} hasMore={hasMore} />
    </>
  )
}
