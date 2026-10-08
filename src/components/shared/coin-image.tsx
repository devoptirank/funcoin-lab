"use client"
import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

/**
 * A library coin render. Falls back to the project's mascot if the coin file isn't there yet
 * (new ideas get their coin after the art script runs).
 */
export function CoinImage({
  src,
  fallback,
  alt = "",
  size,
  priority,
  className,
  sizes,
}: {
  src: string
  fallback?: string
  alt?: string
  size: number
  priority?: boolean
  className?: string
  sizes?: string
}) {
  const [failed, setFailed] = useState(false)
  const url = failed && fallback ? fallback : src
  return (
    <Image
      src={url}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      sizes={sizes ?? `${size}px`}
      draggable={false}
      onError={() => setFailed(true)}
      className={cn("select-none object-contain", className)}
    />
  )
}
