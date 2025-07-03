import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Integration Configuration",
}

export default function IntegrationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 