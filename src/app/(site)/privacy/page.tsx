import { LegalDocument, legalMetadata } from "@/components/shared/legal-document"

export const metadata = legalMetadata("privacy")

export default function Page() {
  return <LegalDocument slug="privacy" />
}
