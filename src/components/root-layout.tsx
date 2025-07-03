"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/header"

export function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (!pathname) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <main className={pathname.match(/^\/workflows\/[^/]+$/) ? '' : 'max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'}>
        {children}
      </main>
    </>
  )
} 