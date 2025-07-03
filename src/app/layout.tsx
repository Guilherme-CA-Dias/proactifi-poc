import "./globals.css"
import '@integration-app/react/styles.css'
import { Instrument_Sans } from 'next/font/google'

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
})

import { AuthProvider } from "./auth-provider"
import { RootLayout } from "@/components/root-layout"
import { IntegrationProvider } from "./integration-provider"

export const metadata = {
  title: {
    default: "Integration App",
    template: "%s | Integration App",
  },
  description: "Integration App",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={instrumentSans.className}>
        <AuthProvider>
          <IntegrationProvider>
            <RootLayout>
              {children}
            </RootLayout>
          </IntegrationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
