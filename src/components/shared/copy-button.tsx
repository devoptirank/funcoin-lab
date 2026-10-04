"use client"
import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { copyText } from "@/lib/client-api"
import { cn } from "@/lib/utils"

export function CopyButton({
  text,
  label,
  className,
  size = "sm",
  variant = "glass",
}: {
  text: string
  label?: string
  className?: string
  size?: "sm" | "xs" | "default" | "icon-sm" | "icon"
  variant?: "glass" | "ghost" | "outline"
}) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn("shrink-0", className)}
      aria-label={label ? undefined : "Copy to clipboard"}
      onClick={async () => {
        if (await copyText(text)) {
          setCopied(true)
          toast.success("Copied to clipboard")
          setTimeout(() => setCopied(false), 1500)
        } else toast.error("Couldn't access the clipboard")
      }}
    >
      {copied ? <Check className="text-lab" /> : <Copy />}
      {label && <span>{copied ? "Copied" : label}</span>}
    </Button>
  )
}
