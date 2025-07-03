import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useIntegrationApp, IntegrationElementProvider, DataInput, IntegrationAppClientProvider } from "@integration-app/react"
import { Action, ErrorData } from "@integration-app/sdk"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Play } from "lucide-react"
import ReactJson from 'react-json-view'

interface RunActionDialogProps {
  isOpen: boolean
  onClose: () => void
  action: Action | null
  integrationKey: string
  connection: string | undefined
}

// Store input values for each action
const actionInputCache: Record<string, Record<string, unknown>> = {}

export function RunActionDialog({
  isOpen,
  onClose,
  action,
  integrationKey,
  connection,
}: RunActionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [inputValues, setInputValues] = useState<Record<string, unknown>>({})
  const [runResult, setRunResult] = useState<unknown | null>(null)
  const integrationApp = useIntegrationApp()

  // Load cached inputs when action changes or dialog opens
  useEffect(() => {
    if (action) {
      const actionKey = `${integrationKey}:${action.id}`

      // If we have cached values for this action, use them
      if (actionInputCache[actionKey]) {
        setInputValues(actionInputCache[actionKey])
      } else {
        // Otherwise initialize with empty values
        setInputValues({})
      }

      // Reset result when action changes
      setRunResult(null)
    }
  }, [action, integrationKey])

  // Cache input values whenever they change
  useEffect(() => {
    if (action) {
      const actionKey = `${integrationKey}:${action.id}`
      actionInputCache[actionKey] = inputValues
    }
  }, [inputValues, action, integrationKey])

  const handleRunAction = async () => {
    if (!action) return

    try {
      setIsLoading(true)
      setRunResult(null)

      const result = await integrationApp
        .connection(integrationKey)
        .action(action.id).run(inputValues)

      setRunResult(result)
      toast.success("Action executed successfully")
    } catch (error) {
      const errorData = error as ErrorData
      console.dir(error)
      toast.error("Failed to run action")
      setRunResult(errorData.data)
    } finally {
      setIsLoading(false)
    }
  }

  if (!action) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex flex-row gap-4 overflow-hidden flex-1">
          <div className="flex-1 flex flex-col min-w-0">
            <DialogHeader>
              <DialogTitle>Run Action: {action.name}</DialogTitle>
            </DialogHeader>

            <div className="py-4 flex-1 overflow-auto">
              <IntegrationAppClientProvider client={integrationApp}>
                <IntegrationElementProvider
                  integrationId={integrationKey}
                  connectionId={connection}
                >
                  <DataInput
                    schema={action.inputSchema || {}}
                    value={inputValues}
                    onChange={(value) => {
                      console.log({ value })
                      setInputValues(value)
                    }}
                  />
                </IntegrationElementProvider>
              </IntegrationAppClientProvider>
            </div>

            <DialogFooter className="mt-auto pt-4 border-t">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleRunAction} disabled={isLoading} className="gap-2">
                {isLoading ? (
                  "Running..."
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Action
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>

          <div className="flex-1 border-l pl-4 min-w-0">
            <h3 className="text-sm font-medium mb-2">Run Result</h3>
            <div className="h-[300px] overflow-hidden">
              {runResult ? (
                <Card className="p-0 bg-transparent border-0 shadow-none h-full">
                  <div className="p-4 h-full overflow-auto">
                    <ReactJson
                      src={runResult as object}
                      name={false}
                      theme="rjv-default"
                      displayDataTypes={false}
                      enableClipboard={false}
                      style={{
                        backgroundColor: 'transparent',
                        fontSize: '0.75rem'
                      }}
                    />
                  </div>
                </Card>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  Run result will show here
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 