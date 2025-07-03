"use client"

import { useState, useEffect } from "react"
import { useIntegrationApp } from "@integration-app/react"
import { Action, DataSchema } from '@integration-app/sdk'
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface ActionSchemasProps {
  actionId: string
  integrationKey: string
}

function SchemaView({ schema, title }: { schema: DataSchema | undefined, title: string }) {
  return (
    <div className="mt-2 space-y-2">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h4>
      <div className="max-w-[350px] overflow-x-auto">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 text-sm">
          <code className="text-gray-800 dark:text-gray-200">
            {JSON.stringify(schema || {}, null, 2)}
          </code>
        </div>
      </div>
    </div>
  )
}

export function ActionSchemas({ actionId, integrationKey }: ActionSchemasProps) {
  const [action, setAction] = useState<Action | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const integrationApp = useIntegrationApp()

  useEffect(() => {
    const fetchAction = async () => {
      if (!actionId || !integrationKey) return

      try {
        setIsLoading(true)
        setError(null)
        const actionData = await integrationApp.action(actionId).get()

        setAction(actionData)
      } catch (error) {
        console.error(`Failed to fetch action ${actionId}:`, error)
        setError("Failed to load action details. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAction()
  }, [actionId, integrationKey, integrationApp])

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-4 w-1/3 mb-2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-4 w-1/3 mt-4 mb-2" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!action) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>Action not found or no longer available.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="p-4 w-full">
      <div className="space-y-4">
        <SchemaView
          schema={action.inputSchema || undefined}
          title="Input Schema"
        />
        <SchemaView
          schema={action.defaultOutputSchema || undefined}
          title="Output Schema"
        />
      </div>
    </div>
  )
} 