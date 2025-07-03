"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { useState, useEffect, useMemo } from "react"
import { ChevronDown, ChevronRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIntegrationApp } from "@integration-app/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
        const integrationActions = await integrationApp.integration(selectedIntegration).actions.list()

        setActions(prev => ({
          ...prev,
          [selectedIntegration]: integrationActions
        }))
      } catch (error) {
        console.error(`Failed to fetch actions for ${selectedIntegration}:`, error)
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
        <Tabs
          defaultValue={integrations[0]?.key}
          className="h-[calc(100%-4rem)]"
          onValueChange={(value) => setSelectedIntegration(value)}
        >
          <div className="border-b border-gray-200 dark:border-gray-800">
            <TabsList className="w-full justify-start bg-transparent p-0 h-auto">
              {integrations.map((integration) => (
                <TabsTrigger
                  key={integration.key}
                  value={integration.key}
                  className="flex items-center space-x-2 relative data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary rounded-none px-4 py-2"
                >
                  <div className="relative w-5 h-5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={integration.logoUri}
                      alt={integration.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span>{integration.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {integrations.map((integration) => (
            <TabsContent key={integration.key} value={integration.key} className="h-[calc(100%-3rem)]">
              {isLoading && !actions[integration.key] ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500 dark:text-gray-400">Loading actions...</div>
                </div>
              ) : !actions[integration.key] || actions[integration.key].length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500 dark:text-gray-400">No actions available</div>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-2">
                    {actions[integration.key].map((action) => (
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
                              src={integration.logoUri}
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
                                integrationKey={integration.key}
                              />
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          ))}
        </Tabs>
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