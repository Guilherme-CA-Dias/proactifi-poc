"use client"

import { useIntegrationApp, useIntegration } from "@integration-app/react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function CollectionDetailPage() {
  const router = useRouter()
  const { key, collectionKey } = useParams()
  const integrationApp = useIntegrationApp()
  const { integration } = useIntegration(key as string)
  const [collectionSpec, setCollectionSpec] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCollectionSpec = async () => {
      try {
        setIsLoading(true)
        const spec = await integrationApp
          .integration(key as string)
          .getDataCollection(collectionKey as string)
        setCollectionSpec(spec)
      } catch (error) {
        console.error("Failed to fetch collection spec:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCollectionSpec()
  }, [key, collectionKey, integrationApp])

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (!collectionSpec) {
    return null
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {collectionSpec.name}
        </h1>
        <Button
          variant="ghost"
          onClick={() => router.push(`/integrations/${key}`)}
        >
          Back to Integration
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Collection Specification
            </h2>
            <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto">
              <code>{JSON.stringify(collectionSpec, null, 2)}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
} 