"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { useState, useEffect, useMemo } from "react"
import { ChevronDown, ChevronRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIntegrationApp } from "@integration-app/react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ActionSchemas } from "./action-schemas"
import { RunActionDialog } from "./dialogs/run-action-dialog"

import { Integration, Action } from '@integration-app/sdk'

export function ActionsList() {
  const [expandedAction, setExpandedAction] = useState<string | null>(null)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [actions, setActions] = useState<Record<string, Action[]>>({})
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAction, setSelectedAction] = useState<Action | null>(null)
  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false)
  const integrationApp = useIntegrationApp()

  const connectionForSelectedIntegration = useMemo(() => {
    return integrations.find(integration => integration.key === selectedIntegration)?.connection
  }, [selectedIntegration, integrations])


  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        setIsLoading(true)
        const allIntegrations = await integrationApp.integrations.findAll()

        setIntegrations(allIntegrations)

        if (allIntegrations.length > 0) {
          setSelectedIntegration(allIntegrations[0].key)
        }
      } catch (error) {
        console.error("Failed to fetch integrations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchIntegrations()
  }, [integrationApp])

  useEffect(() => {
    const fetchActions = async () => {
      if (!selectedIntegration) return

      try {
        setIsLoading(true)
        const response = await integrationApp.integration(selectedIntegration).actions.list()
        
        // Handle paginated response - extract items array
        const integrationActions = response?.items || response || []

        setActions(prev => ({
          ...prev,
          [selectedIntegration]: integrationActions
        }))
      } catch (error) {
        console.error(`Failed to fetch actions for ${selectedIntegration}:`, error)
        // Set empty array on error to prevent map errors
        setActions(prev => ({
          ...prev,
          [selectedIntegration]: []
        }))
      } finally {
        setIsLoading(false)
      }
    }

    fetchActions()
  }, [selectedIntegration, integrationApp])

  const handleActionClick = (action: Action, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    setExpandedAction(expandedAction === action.id ? null : action.id)
  }

  const handleRunAction = (action: Action, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedAction(action)
    setIsRunDialogOpen(true)
  }

  return (
    <div className="h-full border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h2>
      </div>

      {isLoading && integrations.length === 0 ? (
        <div className="flex items-center justify-center h-[calc(100%-4rem)]">
          <div className="text-gray-500 dark:text-gray-400">Loading integrations...</div>
        </div>
      ) : integrations.length === 0 ? (
        <div className="flex items-center justify-center h-[calc(100%-4rem)]">
          <div className="text-gray-500 dark:text-gray-400">No integrations available</div>
        </div>
      ) : (
        <div className="h-[calc(100%-4rem)] flex flex-col">
          {/* Integration Dropdown */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <Select
              value={selectedIntegration || ""}
              onValueChange={(value) => setSelectedIntegration(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Integration" />
              </SelectTrigger>
              <SelectContent>
                {integrations.map((integration) => (
                  <SelectItem key={integration.key} value={integration.key}>
                    <div className="flex items-center space-x-2">
                      <div className="relative w-5 h-5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <Image
                          src={integration.logoUri}
                          alt={integration.name}
                          width={20}
                          height={20}
                          className="object-cover"
                        />
                      </div>
                      <span>{integration.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions List */}
          <div className="flex-1">
            {isLoading && !actions[selectedIntegration || ""] ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500 dark:text-gray-400">Loading actions...</div>
              </div>
            ) : !selectedIntegration || !actions[selectedIntegration] || !Array.isArray(actions[selectedIntegration]) || actions[selectedIntegration].length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500 dark:text-gray-400">No actions available</div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {Array.isArray(actions[selectedIntegration]) && actions[selectedIntegration].map((action) => (
                    <Card
                      key={action.id}
                      className="p-2 rounded-none border border-gray-200 dark:border-gray-800 shadow-none"
                    >
                      <div
                        className="flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors p-1.5 -mx-1.5"
                        onClick={(e) => handleActionClick(action, e)}
                      >
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <Image
                            src={integrations.find(i => i.key === selectedIntegration)?.logoUri || ""}
                            alt={action.name}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{action.name}</h3>
                          <pre className="text-xs text-gray-500 dark:text-gray-400">
                            {action.config?.dataSource?.collectionKey}
                          </pre>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                            onClick={(e) => handleRunAction(action, e)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            {expandedAction === action.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {expandedAction === action.id && (
                        <div className="mt-4 space-y-4 border-t border-gray-200 dark:border-gray-800 pt-4">
                          <div className="w-full">
                            <ActionSchemas
                              actionId={action.id}
                              integrationKey={selectedIntegration}
                            />
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      )}

      <RunActionDialog
        isOpen={isRunDialogOpen}
        onClose={() => setIsRunDialogOpen(false)}
        action={selectedAction}
        integrationKey={selectedIntegration || ""}
        connection={connectionForSelectedIntegration?.id}
      />
    </div>
  )
} 