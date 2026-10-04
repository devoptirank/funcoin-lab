import { LegalDocument, legalMetadata } from "@/components/shared/legal-document"

export const metadata = legalMetadata("disclaimer")

export default function Page() {
  return <LegalDocument slug="disclaimer" />
}
