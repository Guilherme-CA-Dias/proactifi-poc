"use client"

import { useIntegrationApp, useIntegration } from "@integration-app/react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Helper function to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default function IntegrationConfigPage() {
  const router = useRouter()
  const { key } = useParams()
  const integrationApp = useIntegrationApp()
  const { integration, loading: isLoading } = useIntegration(key as string)
  const [dataCollections, setDataCollections] = useState<any[]>([])
  const [isLoadingCollections, setIsLoadingCollections] = useState(true)
  const [selectedCollection, setSelectedCollection] = useState<any>(null)
  const [isLoadingSpec, setIsLoadingSpec] = useState(false)
  const [collectionSpec, setCollectionSpec] = useState<any>(null)

  useEffect(() => {
    const fetchDataCollections = async () => {
      try {
        setIsLoadingCollections(true)
        const collections = await integrationApp
          .integration(key as string)
          .getDataCollections()
       
        
        setDataCollections(collections)
      } catch (error) {
        console.error("Failed to fetch collections:", error)
      } finally {
        setIsLoadingCollections(false)
      }
    }
    fetchDataCollections()
  }, [key, integrationApp])

  useEffect(() => {
    if (!isLoading && integration && !integration.connection) {
      router.push("/integrations")
    }
  }, [integration, isLoading, router])

  const handleViewCollection = async (collection: any) => {
    try {
      setSelectedCollection(collection)
      setIsLoadingSpec(true)
      const spec = await integrationApp
        .integration(key as string)
        .getDataCollection(collection.key)
      setCollectionSpec(spec)
    } catch (error) {
      console.error("Failed to fetch collection spec:", error)
    } finally {
      setIsLoadingSpec(false)
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center space-x-2">
          <div className="w-12 h-12 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (!integration?.connection) {
    return null
  }

  return (
    <>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {integration.logoUri ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={integration.logoUri}
                alt={`${integration.name} logo`}
                className="w-12 h-12 rounded-lg"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl font-medium text-gray-600 dark:text-gray-300">
                {integration.name[0]}
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {integration.name} Configuration
            </h1>
          </div>
          <Button
            variant="ghost"
            onClick={() => router.push("/integrations")}
          >
            Back to Integrations
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-5">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Connection Details
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Connection ID: {integration.connection.id}
              </p>
            </div>
            
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-5">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Data Collections:
              </h2>
              {isLoadingCollections ? (
                <div className="space-y-4">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ) : (
                <div className="space-y-2">
                  {dataCollections.map((collection) => (
                    <div
                      key={collection.key}
                      className="block p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg text-gray-900 dark:text-white">
                          {collection.name}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCollection(collection)}
                        >
                          View Details →
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={!!selectedCollection}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCollection(null)
            setCollectionSpec(null)
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCollection?.name} Specification
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingSpec ? (
            <div className="space-y-4">
              <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-32 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ) : (
            <div className="mt-4">
              <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-[60vh]">
                <code>{JSON.stringify(collectionSpec, null, 2)}</code>
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
} 