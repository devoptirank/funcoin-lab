"use client"
import { useState } from "react"
import type { MemeConcept } from "@/lib/types"
import { BrandPicker } from "./brand-picker"
import { LogoStudio } from "./logo-studio"
import { BrandKit } from "./brand-kit"
import { MemeGallery } from "./meme-gallery"
import { SocialBios } from "./social-bios"
import { ContentGenerator } from "./content-generator"
import { EmptyState } from "@/components/shared/empty-state"
import { ButtonLink } from "@/components/shared/button-link"

export type ToolKind = "logo" | "memes" | "social" | "content" | "social-all"

export function ToolWorkspace({ tool }: { tool: ToolKind }) {
  const [concept, setConcept] = useState<MemeConcept | null>(null)
  return (
    <div className="flex flex-col gap-8">
      <BrandPicker value={concept} onChange={setConcept} />
      {!concept ? (
        <EmptyState
          emoji="🧪"
          title="No meme brand selected"
          description="Type a quick idea above, or generate a full brand first."
          action={
            <ButtonLink href="/create" variant="glow" size="lg" className="px-4">
              Create a meme brand
            </ButtonLink>
          }
        />
      ) : tool === "logo" ? (
        <div className="flex flex-col gap-12">
          <LogoStudio concept={concept} />
          <section aria-labelledby="kit-heading">
            <h2 id="kit-heading" className="mb-4 font-heading text-2xl font-extrabold">AI Brand Kit</h2>
            <BrandKit concept={concept} />
          </section>
        </div>
      ) : tool === "memes" ? (
        <MemeGallery concept={concept} count={9} />
      ) : tool === "social" ? (
        <SocialBios concept={concept} />
      ) : tool === "social-all" ? (
        <div className="flex flex-col gap-12">
          <SocialBios concept={concept} />
          <ContentGenerator concept={concept} />
        </div>
      ) : (
        <ContentGenerator concept={concept} />
      )}
    </div>
  )
}
