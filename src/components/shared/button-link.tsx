import Link from "next/link"
import type { VariantProps } from "class-variance-authority"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>

/** A Next.js Link styled as a button (keeps real <a> semantics for SEO and prefetching). */
export function ButtonLink({ className, variant, size, ...props }: Props) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
