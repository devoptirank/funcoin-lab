import { LegalDocument, legalMetadata } from "@/components/shared/legal-document"

export const metadata = legalMetadata("terms")

export default function Page() {
  return <LegalDocument slug="terms" />
}
